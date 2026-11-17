import { reactive } from 'vue'
import { api, refreshSession, setAccessToken, setAuthLostHandler } from '../api.js'
import { useProjectsStore } from './projects.js'

// Plain Vue reactivity (no Pinia): a single module-level reactive object acts
// as the store singleton. `get` accessors below are real JS getters — Vue's
// reactive() proxy tracks the state they read, so they stay reactive just
// like Pinia getters would.
//
// Auth is real now: the back-end gives a short-lived access token (kept in memory in api.js)
// and an httpOnly refresh cookie. On page load `init()` tries to resume the session with it.
const store = reactive({
  currentUser: null,

  get isAuthenticated() {
    return store.currentUser !== null
  },
  get currentUserId() {
    return store.currentUser?.id ?? null
  },

  // resume the session from the refresh cookie (called once before the app is mounted)
  async init() {
    try {
      const data = await refreshSession()
      store.currentUser = data.user
    } catch {
      store.currentUser = null
    }
  },

  async signIn(email, password) {
    if (!email || !password) return { ok: false, error: 'Email and password are required.' }
    return store.authenticate('/auth/login', { email, password })
  },

  async signUp(fullName, email, password) {
    if (!fullName || !email || !password) return { ok: false, error: 'All fields are required.' }
    if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' }
    return store.authenticate('/auth/signup', { full_name: fullName, email, password })
  },

  async authenticate(path, body) {
    try {
      const data = await api.publicPost(path, body)
      setAccessToken(data.accessToken)
      useProjectsStore().reset()
      store.currentUser = data.user
      return { ok: true }
    } catch (err) {
      return { ok: false, error: describe(err) }
    }
  },

  async signOut() {
    try {
      await api.post('/auth/logout')
    } catch {
      // even if the server can't be reached, forget the session locally
    }
    store.clearSession()
  },

  // revokes every session of this account (all devices / browsers), then this one locally
  async signOutEverywhere() {
    try {
      await api.post('/auth/logout-all')
    } catch (err) {
      return { ok: false, error: describe(err) }
    }
    store.clearSession()
    return { ok: true }
  },

  clearSession() {
    setAccessToken(null)
    store.currentUser = null
    useProjectsStore().reset()
  },
})

setAuthLostHandler(() => store.clearSession())

export function useAuthStore() {
  return store
}

// field-level validation messages ("password: must be 8–72 characters") are more useful than "Validation failed"
function describe(err) {
  const details = err.details ? Object.values(err.details) : []
  return details.length ? details.join(' ') : err.message
}
