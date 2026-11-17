import { Router } from 'express'
import bcrypt from 'bcrypt'
import { env } from '../../config/env.js'
import { pool, withTransaction } from '../../db/pool.js'
import { requireAuth } from '../../middleware/auth.js'
import { rateLimit } from '../../middleware/rateLimit.js'
import { conflict, unauthorized } from '../../utils/httpError.js'
import { parseBody, rules } from '../../utils/validate.js'
import { publicUser } from '../../utils/serialize.js'
import {
  signAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken, revokeAllForUser,
  setRefreshCookie, clearRefreshCookie, readRefreshCookie,
} from './tokens.js'
import { verifyGoogleIdToken } from './google.js'

export const authRouter = Router()

const BCRYPT_COST = 12
// compared against when the email is unknown, so "no such user" and "wrong password" take the same time
const DUMMY_HASH = await bcrypt.hash('studioflow-dummy-password', BCRYPT_COST)

const limiter = rateLimit({ max: env.AUTH_RATE_LIMIT_MAX })

const nonEmpty = (v) => {
  if (typeof v !== 'string' || v.length === 0 || v.length > 200) throw new Error('must be a non-empty string')
  return v
}

// opens a session: refresh token in an httpOnly cookie, access token + user in the JSON body
async function startSession(req, res, user, status = 200) {
  const { token, expiresAt } = await issueRefreshToken(user.id, req.get('user-agent'))
  setRefreshCookie(res, token, expiresAt)
  res.status(status).json({ accessToken: signAccessToken(user.id), user: publicUser(user) })
}

// POST /auth/signup  { full_name, email, password }
authRouter.post('/signup', limiter, async (req, res) => {
  const body = parseBody(req.body, {
    full_name: rules.string({ max: 100 }),
    email: rules.email(),
    password: rules.password(),
  })
  const passwordHash = await bcrypt.hash(body.password, BCRYPT_COST)

  let result
  try {
    ;[result] = await pool.execute('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)', [
      body.full_name, body.email, passwordHash,
    ])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw conflict('An account with this email already exists.', { code: 'email_taken' })
    throw err
  }
  await startSession(req, res, { id: result.insertId, full_name: body.full_name, email: body.email }, 201)
})

// POST /auth/login  { email, password }
authRouter.post('/login', limiter, async (req, res) => {
  const body = parseBody(req.body, { email: rules.email(), password: nonEmpty })
  const [rows] = await pool.execute('SELECT id, full_name, email, password_hash FROM users WHERE email = ?', [body.email])
  const user = rows[0]

  const matches = await bcrypt.compare(body.password, user?.password_hash ?? DUMMY_HASH)
  if (!user || !user.password_hash || !matches) {
    throw unauthorized('Invalid email or password.', { code: 'invalid_credentials' })
  }
  await startSession(req, res, user)
})

// POST /auth/google  { credential }   (the ID token from Google Identity Services)
authRouter.post('/google', limiter, async (req, res) => {
  const body = parseBody(req.body, { credential: nonEmpty })
  const google = await verifyGoogleIdToken(body.credential)

  const user = await withTransaction(async (conn) => {
    const [linked] = await conn.execute(
      "SELECT u.id, u.full_name, u.email FROM accounts a JOIN users u ON u.id = a.user_id WHERE a.provider = 'google' AND a.provider_account_id = ?",
      [google.sub]
    )
    if (linked[0]) return linked[0]

    // first Google sign-in: attach to the existing account with that (verified) email, or create one
    const [existing] = await conn.execute('SELECT id, full_name, email FROM users WHERE email = ?', [google.email])
    let row = existing[0]
    if (!row) {
      const fullName = google.name.slice(0, 100)
      const [created] = await conn.execute('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, NULL)', [fullName, google.email])
      row = { id: created.insertId, full_name: fullName, email: google.email }
    }
    await conn.execute("INSERT INTO accounts (user_id, provider, provider_account_id) VALUES (?, 'google', ?)", [row.id, google.sub])
    return row
  })
  await startSession(req, res, user)
})

// POST /auth/refresh  (cookie) -> new access token, refresh token rotated
authRouter.post('/refresh', async (req, res) => {
  const raw = readRefreshCookie(req)
  if (!raw) throw unauthorized('No refresh token.', { code: 'no_refresh' })

  let session
  try {
    session = await rotateRefreshToken(raw, req.get('user-agent'))
  } catch (err) {
    clearRefreshCookie(res)
    throw err
  }
  const [rows] = await pool.execute('SELECT id, full_name, email FROM users WHERE id = ?', [session.userId])
  if (!rows[0]) {
    clearRefreshCookie(res)
    throw unauthorized('Account no longer exists.', { code: 'invalid_refresh' })
  }
  setRefreshCookie(res, session.token, session.expiresAt)
  res.json({ accessToken: signAccessToken(session.userId), user: publicUser(rows[0]) })
})

// POST /auth/logout -> revokes this session's refresh token
authRouter.post('/logout', async (req, res) => {
  const raw = readRefreshCookie(req)
  if (raw) await revokeRefreshToken(raw)
  clearRefreshCookie(res)
  res.status(204).end()
})

// POST /auth/logout-all -> revokes every session of the current user (all devices)
authRouter.post('/logout-all', requireAuth, async (req, res) => {
  await revokeAllForUser(req.user.id)
  clearRefreshCookie(res)
  res.status(204).end()
})

// GET /auth/me
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})
