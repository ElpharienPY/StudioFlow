<script setup>
import SidebarNav from './SidebarNav.vue'
import UserFooter from './UserFooter.vue'
import logo from '../../assets/studioflow-logo.png'
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <img :src="logo" alt="StudioFlow" class="brand-mark" />
        <span class="brand-name">Studio<span class="brand-accent">Flow</span></span>
      </div>
      <SidebarNav />
      <div class="spacer" />
      <UserFooter />
    </aside>
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  height: 100%;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: var(--space-4) var(--space-3);
  border-right: 1px solid var(--color-border-subtle);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-2) var(--space-4);
}

.brand-mark {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.brand-name {
  font-weight: 700;
  font-size: 1.05rem;
}

.brand-accent {
  color: var(--color-accent-400);
}

.spacer {
  flex: 1;
}

.content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: var(--space-6);
}

@media (max-width: 720px) {
  .sidebar {
    width: 72px;
  }
  .brand-name,
  .nav-link .label {
    display: none;
  }
}
</style>
