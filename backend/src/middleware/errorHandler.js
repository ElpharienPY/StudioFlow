import { HttpError } from '../utils/httpError.js'
import { env } from '../config/env.js'

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'not_found', message: `Route not found: ${req.method} ${req.path}` } })
}

// Every error leaves the API as { error: { code, message, details? } }
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'bad_json', message: 'Request body is not valid JSON.' } })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'payload_too_large', message: 'Request body is too large.' } })
  }
  // MySQL: unique key violated / foreign key points to a missing row
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: { code: 'conflict', message: 'This record already exists.' } })
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: { code: 'bad_reference', message: 'A referenced record does not exist.' } })
  }

  console.error(err)
  res.status(500).json({
    error: { code: 'internal_error', message: 'Internal server error.', ...(env.isProd ? {} : { details: err.message }) },
  })
}
