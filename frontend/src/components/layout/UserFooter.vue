<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import Avatar from '../ui/Avatar.vue'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="footer" v-if="auth.currentUser">
    <Avatar :user="auth.currentUser" :size="32" />
    <div class="info">
      <div class="name">{{ auth.currentUser.full_name }}</div>
      <div class="email">{{ auth.currentUser.email }}</div>
    </div>
    <button type="button" class="logout" title="Sign out" @click="logout">⎋</button>
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
</style>
