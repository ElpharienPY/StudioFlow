// Tiny fetch wrapper for the StudioFlow REST API (see backend/README.md).
//
// - The access token (15 min) lives in memory only; the refresh token is an httpOnly cookie
//   the browser sends by itself, hence `credentials: 'include'`.
// - On `401 token_expired` we call POST /auth/refresh once (concurrent calls share the same
//   refresh) and retry the request.
// - Errors are thrown as ApiError { status, code, message, details } so callers can show `message`.

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

let accessToken = null
let refreshing = null
let onAuthLost = () => {}

export function setAccessToken(token) {
  accessToken = token
}

// called when the session can't be refreshed any more (expired / revoked) so the UI can go back to /login
export function setAuthLostHandler(handler) {
  onAuthLost = handler
}

async function rawRequest(method, path, body, { auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'network_error', `Can't reach the server (${API_URL}). Is the back-end running?`)
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = data?.error ?? {}
    throw new ApiError(res.status, err.code ?? 'error', err.message ?? `Request failed (${res.status})`, err.details)
  }
  return data
}

// Returns true when a new access token was obtained.
export function refreshSession() {
  refreshing ??= rawRequest('POST', '/auth/refresh', undefined, { auth: false })
    .then((data) => {
      accessToken = data.accessToken
      return data
    })
    .catch((err) => {
      accessToken = null
      throw err
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

async function request(method, path, body) {
  try {
    return await rawRequest(method, path, body)
  } catch (err) {
    if (err.status === 401 && err.code === 'token_expired') {
      try {
        await refreshSession()
      } catch {
        onAuthLost()
        throw err
      }
      return rawRequest(method, path, body)
    }
    if (err.status === 401) onAuthLost()
    throw err
  }
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body ?? {}),
  patch: (path, body) => request('PATCH', path, body ?? {}),
  delete: (path) => request('DELETE', path),
  // auth endpoints: never carry / retry with an expired access token
  publicPost: (path, body) => rawRequest('POST', path, body ?? {}, { auth: false }),
}
