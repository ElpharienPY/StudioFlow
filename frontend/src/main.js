import { createApp, watch } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth.js'

// Try to resume the session (refresh cookie) before the first navigation so a page reload
// doesn't bounce a signed-in user back to /login.
const auth = useAuthStore()
await auth.init()

// session lost (expired refresh token, sign-out in another tab...) -> back to the login page
watch(
  () => auth.isAuthenticated,
  (signedIn) => {
    if (!signedIn && router.currentRoute.value.name !== 'login') router.push({ name: 'login' })
  }
)

createApp(App).use(router).mount('#app')
