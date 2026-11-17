<script setup>
// Official "Sign in with Google" button (Google Identity Services). Google returns an ID token
// ("credential") that we emit; the back-end verifies it (POST /auth/google) and opens a session.
// Uses GOOGLE_CLIENT_ID from constants.js (see frontend/README.md).
import { ref, onMounted, watch } from 'vue'
import { GOOGLE_CLIENT_ID as CLIENT_ID } from '../../constants.js'

const props = defineProps({
  text: { type: String, default: 'signin_with' }, // 'signin_with' | 'signup_with'
})
const emit = defineEmits(['credential'])

const container = ref(null)
const failed = ref(false)

// the script is shared by every mount of the component
let scriptPromise = null
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve()
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = resolve
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Google script failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

function render() {
  if (!container.value || !window.google?.accounts?.id) return
  container.value.innerHTML = ''
  window.google.accounts.id.renderButton(container.value, {
    theme: 'filled_black',
    size: 'large',
    shape: 'rectangular',
    text: props.text,
    width: container.value.clientWidth || 352,
  })
}

onMounted(async () => {
  try {
    await loadGoogleScript()
  } catch {
    failed.value = true
    return
  }
  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (response) => emit('credential', response.credential),
  })
  render()
})

watch(() => props.text, render)
</script>

<template>
  <div v-if="CLIENT_ID">
    <div ref="container" class="google-button" />
    <p v-if="failed" class="failed">Google sign-in is unavailable right now (couldn't reach Google).</p>
  </div>
</template>

<style scoped>
.google-button {
  display: flex;
  justify-content: center;
  min-height: 44px;
}

.failed {
  margin: 0;
  text-align: center;
  color: #64748b;
  font-size: 0.8rem;
}
</style>
