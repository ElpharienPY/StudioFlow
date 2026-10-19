import { reactive } from 'vue'
import { users as seedUsers } from '../data/fixtures.js'

const SESSION_KEY = 'studioflow.session'

// Plain Vue reactivity (no Pinia): a single module-level reactive object acts
// as the store singleton. `get` accessors below are real JS getters — Vue's
// reactive() proxy tracks the state they read, so they stay reactive just
// like Pinia getters would.
const store = reactive({
  users: [...seedUsers],
  currentUserId: loadSession(),

  get isAuthenticated() {
    return store.currentUserId !== null
  },
  get currentUser() {
    return store.users.find((u) => u.id === store.currentUserId) ?? null
  },

  // mock auth: no backend yet (Milestone 3) — password isn't actually checked
  signIn(email, password) {
    if (!email || !password) return { ok: false, error: 'Email and password are required.' }
    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user) return { ok: false, error: 'No account found for this email. Try signing up instead.' }
    store.setSession(user.id)
    return { ok: true }
  },

  signUp(fullName, email, password) {
    if (!fullName || !email || !password) return { ok: false, error: 'All fields are required.' }
    if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' }
    if (store.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'An account with this email already exists.' }
    }
    const user = {
      id: Math.max(...store.users.map((u) => u.id)) + 1,
      full_name: fullName,
      email,
      initials: initialsOf(fullName),
      color: randomAccent(),
    }
    store.users.push(user)
    store.setSession(user.id)
    return { ok: true }
  },

  signOut() {
    store.currentUserId = null
    localStorage.removeItem(SESSION_KEY)
  },

  setSession(userId) {
    store.currentUserId = userId
    localStorage.setItem(SESSION_KEY, String(userId))
  },
})

export function useAuthStore() {
  return store
}

function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  return raw ? Number(raw) : null
}

function initialsOf(fullName) {
  return fullName
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

function randomAccent() {
  const palette = ['#6366f1', '#10b981', '#a855f7', '#ec4899', '#06b6d4', '#f59e0b']
  return palette[Math.floor(Math.random() * palette.length)]
}
