<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import Avatar from '../ui/Avatar.vue'

const auth = useAuthStore()
const router = useRouter()

const error = ref('')

async function logout() {
  await auth.signOut()
  router.push('/login')
}

// e.g. after using a shared computer: every refresh token of the account is revoked
async function logoutEverywhere() {
  if (!window.confirm('Sign out of StudioFlow on all your devices?')) return
  error.value = ''
  const result = await auth.signOutEverywhere()
  if (!result.ok) {
    error.value = result.error
    return
  }
  router.push('/login')
}
</script>

<template>
  <div v-if="auth.currentUser" class="user">
    <div class="footer">
      <Avatar :user="auth.currentUser" :size="32" />
      <div class="info">
        <div class="name">{{ auth.currentUser.full_name }}</div>
        <div class="email">{{ auth.currentUser.email }}</div>
      </div>
      <button type="button" class="logout" title="Sign out" aria-label="Sign out" @click="logout">⎋</button>
    </div>
    <button type="button" class="logout-all" @click="logoutEverywhere">Sign out of all devices</button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.footer {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-top: 1px solid var(--color-border-subtle);
}

.info {
  min-width: 0;
  flex: 1;
}

.name {
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email {
  font-size: 0.72rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
}

.logout:hover {
  color: var(--color-surface-50);
}

.logout-all {
  display: block;
  width: 100%;
  margin-top: 4px;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 0.72rem;
  text-align: left;
  padding: 2px var(--space-2);
}

.logout-all:hover {
  color: var(--color-surface-50);
  text-decoration: underline;
}

.error {
  margin: 4px var(--space-2) 0;
  color: #fca5a5;
  font-size: 0.72rem;
}

@media (max-width: 720px) {
  .logout-all {
    display: none;
  }
}
</style>
