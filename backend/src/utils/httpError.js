export class HttpError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message)
    this.status = status
    this.code = code ?? defaultCode(status)
    this.details = details
  }
}

function defaultCode(status) {
  return (
    { 400: 'bad_request', 401: 'unauthorized', 403: 'forbidden', 404: 'not_found', 409: 'conflict', 429: 'too_many_requests', 501: 'not_implemented' }[status] ??
    'error'
  )
}

export const badRequest = (msg, opts) => new HttpError(400, msg, opts)
export const unauthorized = (msg = 'Authentication required.', opts) => new HttpError(401, msg, opts)
export const forbidden = (msg = 'You do not have permission to do this.', opts) => new HttpError(403, msg, opts)
export const notFound = (msg = 'Not found.', opts) => new HttpError(404, msg, opts)
export const conflict = (msg, opts) => new HttpError(409, msg, opts)
