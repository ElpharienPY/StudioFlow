import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { pool, withTransaction } from '../../db/pool.js'
import { unauthorized } from '../../utils/httpError.js'

const COOKIE_NAME = 'refresh_token'
// a refresh token used again right after rotation is most likely a double request from the
// front (two tabs/calls at once), not theft: reject it but don't kill every session
const REUSE_GRACE_MS = 10_000

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')

// ---- access token (short-lived JWT, sent as "Authorization: Bearer ...") ----
export function signAccessToken(userId) {
  return jwt.sign({}, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    subject: String(userId),
    expiresIn: env.ACCESS_TOKEN_TTL,
  })
}

// ---- refresh token (random opaque string, only its sha-256 is stored in DB) ----
export async function issueRefreshToken(userId, userAgent, conn = pool) {
  const token = crypto.randomBytes(48).toString('base64url')
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
  await conn.execute(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent) VALUES (?, ?, ?, ?)',
    [userId, sha256(token), expiresAt, (userAgent ?? '').slice(0, 255) || null]
  )
  return { token, expiresAt }
}

const invalidRefresh = () => unauthorized('Invalid or expired refresh token.', { code: 'invalid_refresh' })

// Rotation: each refresh token works once; using it returns a brand-new one.
export async function rotateRefreshToken(rawToken, userAgent) {
  const [rows] = await pool.execute(
    'SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = ?',
    [sha256(rawToken)]
  )
  const row = rows[0]
  if (!row) throw invalidRefresh()

  if (row.revoked_at) {
    if (Date.now() - new Date(row.revoked_at).getTime() > REUSE_GRACE_MS) await revokeAllForUser(row.user_id)
    throw invalidRefresh()
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) throw invalidRefresh()

  return withTransaction(async (conn) => {
    const [result] = await conn.execute('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ? AND revoked_at IS NULL', [row.id])
    if (result.affectedRows !== 1) throw invalidRefresh() // lost a race with a parallel refresh
    const next = await issueRefreshToken(row.user_id, userAgent, conn)
    return { userId: row.user_id, ...next }
  })
}

export async function revokeRefreshToken(rawToken) {
  await pool.execute('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL', [sha256(rawToken)])
}

export async function revokeAllForUser(userId) {
  await pool.execute('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL', [userId])
}

// ---- cookie: httpOnly so JS (and XSS) can never read it; only sent to /auth/* routes ----
const baseCookie = { httpOnly: true, secure: env.isProd, sameSite: 'lax', path: '/auth' }

export const setRefreshCookie = (res, token, expiresAt) => res.cookie(COOKIE_NAME, token, { ...baseCookie, expires: expiresAt })
export const clearRefreshCookie = (res) => res.clearCookie(COOKIE_NAME, baseCookie)
export const readRefreshCookie = (req) => req.cookies?.[COOKIE_NAME]
