<script setup>
const links = [
  { to: '/projects', label: 'Projects', icon: '▦' },
  { to: '/boards', label: 'Boards', icon: '⟟' },
  { to: '/deliverables', label: 'Deliverables', icon: '◎' },
  { to: '/assets', label: 'Assets', icon: '☑' },
  { to: '/team', label: 'Team', icon: '◒' },
]
</script>

<template>
  <nav class="nav">
    <router-link v-for="link in links" :key="link.to" :to="link.to" class="nav-link" active-class="active">
      <span class="icon">{{ link.icon }}</span>
      {{ link.label }}
    </router-link>
  </nav>
</template>

<style scoped>
.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 9px 12px;
  border-radius: var(--radius-md);
  color: #94a3b8;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.92rem;
}

.nav-link:hover {
  background: var(--color-surface-800);
  color: var(--color-surface-50);
}

.nav-link.active {
  background: var(--color-accent-500);
  color: white;
}

.icon {
  width: 18px;
  text-align: center;
}
</style>
