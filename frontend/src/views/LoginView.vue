<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import logo from '../assets/studioflow-logo.png'
import GoogleSignInButton from '../components/auth/GoogleSignInButton.vue'

// the Google button only shows up when an OAuth client id is configured (frontend/.env)
const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

const router = useRouter()
const auth = useAuthStore()

const mode = ref('signin') // 'signin' | 'signup'
const fullName = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const isSignUp = computed(() => mode.value === 'signup')

function switchMode(next) {
  mode.value = next
  error.value = ''
}

async function submit() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  const result = isSignUp.value
    ? await auth.signUp(fullName.value, email.value, password.value)
    : await auth.signIn(email.value, password.value)
  loading.value = false

  if (!result.ok) {
    error.value = result.error
    return
  }
  router.push('/')
}

async function googleSignIn(credential) {
  if (loading.value) return
  loading.value = true
  error.value = ''
  const result = await auth.signInWithGoogle(credential)
  loading.value = false
  if (!result.ok) {
    error.value = result.error
    return
  }
  router.push('/')
}

// dev-only shortcut to skip retyping credentials while iterating — stripped from prod builds
const isDev = import.meta.env.DEV
async function devSignIn() {
  // demo account created by `npm run db:seed` in the back-end
  const result = await auth.signIn('user1@studioflow.co', 'password123')
  if (!result.ok) {
    error.value = result.error
    return
  }
  router.push('/')
}
</script>

<template>
  <div class="page">
    <div class="card">
      <div class="brand">
        <img :src="logo" alt="StudioFlow" class="brand-mark" />
        <span class="brand-name">Studio<span class="brand-accent">Flow</span></span>
      </div>

      <h1>{{ isSignUp ? 'Create your account' : 'Welcome back' }}</h1>
      <p class="subtitle">
        {{ isSignUp ? 'Start keeping your productions moving.' : 'Sign in to keep your productions moving.' }}
      </p>

      <div class="tabs">
        <button type="button" :class="{ active: !isSignUp }" @click="switchMode('signin')">Sign in</button>
        <button type="button" :class="{ active: isSignUp }" @click="switchMode('signup')">Sign up</button>
      </div>

      <form class="form" @submit.prevent="submit">
        <label v-if="isSignUp" class="field">
          <span>Full name</span>
          <input v-model="fullName" type="text" placeholder="User 1" autocomplete="name" />
        </label>

        <label class="field">
          <span>Email</span>
          <input v-model="email" type="email" placeholder="user1@studioflow.co" autocomplete="email" />
        </label>

        <label class="field">
          <span>Password</span>
          <input v-model="password" type="password" placeholder="••••••••••••" autocomplete="current-password" />
        </label>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" class="submit" :disabled="loading">
          {{ loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in' }}
        </button>
      </form>

      <template v-if="googleEnabled">
        <div class="divider"><span>or</span></div>
        <GoogleSignInButton :text="isSignUp ? 'signup_with' : 'signin_with'" @credential="googleSignIn" />
      </template>

      <p class="switch">
        <template v-if="isSignUp">
          Already have an account? <a href="#" @click.prevent="switchMode('signin')">Sign in</a>
        </template>
        <template v-else>
          New to StudioFlow? <a href="#" @click.prevent="switchMode('signup')">Create an account</a>
        </template>
      </p>

      <button v-if="isDev" type="button" class="dev-shortcut" @click="devSignIn">
        ⚡ Dev sign-in (skips the form while iterating)
      </button>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}

.card {
  width: 100%;
  max-width: 400px;
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.brand-mark {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.brand-name {
  font-weight: 700;
  font-size: 1.1rem;
}

.brand-accent {
  color: var(--color-accent-400);
}

h1 {
  text-align: center;
  font-size: 1.5rem;
  margin: 0 0 4px;
}

.subtitle {
  text-align: center;
  color: #94a3b8;
  margin: 0 0 var(--space-4);
  font-size: 0.9rem;
}

.tabs {
  display: flex;
  background: var(--color-surface-950);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 4px;
  margin-bottom: var(--space-4);
}

.tabs button {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  color: #94a3b8;
  border-radius: calc(var(--radius-md) - 4px);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
}

.tabs button.active {
  background: var(--color-surface-800);
  color: var(--color-surface-50);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
}

input {
  background: var(--color-surface-950);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  color: var(--color-surface-50);
  font-size: 0.95rem;
}

input:focus {
  outline: none;
  border-color: var(--color-accent-500);
}

.error {
  margin: 0;
  color: #fca5a5;
  font-size: 0.85rem;
}

.submit {
  margin-top: var(--space-1);
  background: var(--color-accent-500);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 11px;
  font-weight: 600;
  cursor: pointer;
}

.submit:hover {
  background: var(--color-accent-600);
}

.divider {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: #64748b;
  font-size: 0.8rem;
  margin: var(--space-4) 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border-subtle);
}

.switch {
  text-align: center;
  margin: var(--space-4) 0 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.switch a {
  color: var(--color-accent-400);
  text-decoration: none;
  font-weight: 600;
}

.dev-shortcut {
  width: 100%;
  margin-top: var(--space-3);
  background: transparent;
  border: 1px dashed var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 8px;
  color: #64748b;
  font-size: 0.78rem;
  cursor: pointer;
}

.dev-shortcut:hover {
  border-color: var(--color-accent-500);
  color: var(--color-accent-400);
}
</style>
