import { HttpError } from '../utils/httpError.js'

// Tiny in-memory fixed-window limiter (per IP). Fine for a single-process API;
// use a shared store (Redis) if you ever run several instances.
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 20 } = {}) {
  const hits = new Map()
  return (req, res, next) => {
    const now = Date.now()
    const key = req.ip
    let entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(key, entry)
    }
    entry.count += 1

    if (hits.size > 10000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)

    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
      throw new HttpError(429, 'Too many attempts, please try again later.')
    }
    next()
  }
}
