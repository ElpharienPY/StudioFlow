import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { pool } from '../db/pool.js'
import { unauthorized } from '../utils/httpError.js'

// Expects "Authorization: Bearer <access token>". Sets req.user = { id, full_name, email }.
// Code 'token_expired' tells the front to call POST /auth/refresh and retry.
export async function requireAuth(req, res, next) {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ')
  if (scheme !== 'Bearer' || !token) throw unauthorized()

  let payload
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] })
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw unauthorized('Access token expired.', { code: 'token_expired' })
    throw unauthorized('Invalid access token.', { code: 'invalid_token' })
  }

  const [rows] = await pool.execute('SELECT id, full_name, email FROM users WHERE id = ?', [Number(payload.sub)])
  if (!rows[0]) throw unauthorized('Account no longer exists.', { code: 'invalid_token' })

  req.user = rows[0]
  next()
}
