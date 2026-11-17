import { HttpError, badRequest } from './httpError.js'

// ---- rules: each takes the raw value and returns the cleaned value, or throws Error(message) ----

export const rules = {
  string({ min = 1, max = 255 } = {}) {
    return (v) => {
      if (typeof v !== 'string') throw new Error('must be a string')
      const s = v.trim()
      if (s.length < min) throw new Error(min === 1 ? 'must not be empty' : `must be at least ${min} characters`)
      if (s.length > max) throw new Error(`must be at most ${max} characters`)
      return s
    }
  },
  // free text that may be empty (descriptions)
  text({ max = 10000 } = {}) {
    return (v) => {
      if (typeof v !== 'string') throw new Error('must be a string')
      if (v.length > max) throw new Error(`must be at most ${max} characters`)
      return v.trim()
    }
  },
  email() {
    return (v) => {
      if (typeof v !== 'string') throw new Error('must be a string')
      const s = v.trim().toLowerCase()
      if (s.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new Error('must be a valid email address')
      return s
    }
  },
  password() {
    return (v) => {
      if (typeof v !== 'string') throw new Error('must be a string')
      if (v.length < 8) throw new Error('must be at least 8 characters')
      // bcrypt only reads the first 72 bytes
      if (Buffer.byteLength(v) > 72) throw new Error('must be at most 72 bytes')
      return v
    }
  },
  oneOf(values) {
    return (v) => {
      if (!values.includes(v)) throw new Error(`must be one of: ${values.join(', ')}`)
      return v
    }
  },
  int({ min = 0, max = 2147483647 } = {}) {
    return (v) => {
      if (!Number.isInteger(v)) throw new Error('must be an integer')
      if (v < min || v > max) throw new Error(`must be between ${min} and ${max}`)
      return v
    }
  },
  // array of distinct positive integers (e.g. a list of user ids); duplicates are dropped
  intArray({ max = 50 } = {}) {
    return (v) => {
      if (!Array.isArray(v)) throw new Error('must be an array of ids')
      if (v.length > max) throw new Error(`must contain at most ${max} items`)
      const out = []
      for (const item of v) {
        if (!Number.isInteger(item) || item < 1 || item > 2147483647) throw new Error('must only contain positive integers')
        if (!out.includes(item)) out.push(item)
      }
      return out
    }
  },
  date() {
    return (v) => {
      if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error('must be a date formatted YYYY-MM-DD')
      const d = new Date(`${v}T00:00:00Z`)
      if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) throw new Error('must be a real calendar date')
      return v
    }
  },
  // only http(s): blocks javascript:, data:, etc. from being stored and later rendered as links
  url({ max = 500 } = {}) {
    return (v) => {
      if (typeof v !== 'string') throw new Error('must be a string')
      const s = v.trim()
      if (s.length > max) throw new Error(`must be at most ${max} characters`)
      let u
      try {
        u = new URL(s)
      } catch {
        throw new Error('must be a valid http(s) URL')
      }
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('must be a valid http(s) URL')
      return s
    }
  },
}

// null is accepted and stored as NULL
export const nullable = (rule) => (v) => (v === null ? null : rule(v))
// field may be omitted on create
export const optional = (rule) => Object.assign((v) => rule(v), { optional: true })

/**
 * Validates `body` against `schema` ({ field: rule }) and returns only the schema's fields.
 * partial=true (PATCH): missing fields are skipped, but at least one field is required.
 * Throws a 400 with { details: { field: message } }.
 */
export function parseBody(body, schema, { partial = false } = {}) {
  if (body === undefined || body === null) body = {}
  if (typeof body !== 'object' || Array.isArray(body)) throw badRequest('Request body must be a JSON object.')

  const out = {}
  const errors = {}
  for (const [key, rule] of Object.entries(schema)) {
    const value = body[key]
    if (value === undefined) {
      if (!partial && !rule.optional) errors[key] = 'is required'
      continue
    }
    try {
      out[key] = rule(value)
    } catch (e) {
      errors[key] = e.message
    }
  }
  if (Object.keys(errors).length) {
    throw new HttpError(400, 'Validation failed.', { code: 'validation_error', details: errors })
  }
  if (partial && Object.keys(out).length === 0) throw badRequest('Nothing to update.')
  return out
}

// path/query param -> positive integer, otherwise 404 (an id that can't exist can't be found)
export function idParam(value) {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1 || n > 2147483647) throw new HttpError(404, 'Not found.')
  return n
}
