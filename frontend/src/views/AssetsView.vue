<script setup>
import { ref, computed } from 'vue'
import { useProjectsStore } from '../stores/projects.js'
import AppShell from '../components/layout/AppShell.vue'
import AssetRow from '../components/deliverables/AssetRow.vue'

const store = useProjectsStore()
const kindFilter = ref('all')

const KINDS = ['script', 'raw_footage', 'edit', 'thumbnail', 'export']

const groups = computed(() => {
  if (!store.activeProjectId) return []
  return store
    .deliverablesOf(store.activeProjectId)
    .map((d) => ({
      deliverable: d,
      assets: store
        .assetsOf(d.id)
        .filter((a) => kindFilter.value === 'all' || a.kind === kindFilter.value),
    }))
    .filter((g) => g.assets.length > 0)
})

function latestIdFor(assets) {
  if (!assets.length) return null
  return assets.reduce((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b)).id
}

const totalCount = computed(() => groups.value.reduce((sum, g) => sum + g.assets.length, 0))
</script>

<template>
  <AppShell>
    <header class="header">
      <div>
        <h1>Assets</h1>
        <p class="subtitle">{{ totalCount }} files across {{ store.activeProject?.name }}</p>
      </div>
      <select v-model="kindFilter" class="kind-filter">
        <option value="all">All kinds</option>
        <option v-for="k in KINDS" :key="k" :value="k">{{ k.replace('_', ' ') }}</option>
      </select>
    </header>

    <section v-for="g in groups" :key="g.deliverable.id" class="group">
      <h2>{{ g.deliverable.title }}</h2>
      <div class="asset-list">
        <AssetRow v-for="a in g.assets" :key="a.id" :asset="a" :is-latest="a.id === latestIdFor(g.assets)" />
      </div>
    </section>

    <p v-if="!groups.length" class="empty">No assets match this filter yet.</p>
  </AppShell>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
  gap: var(--space-4);
  flex-wrap: wrap;
}

h1 {
  margin: 0;
  font-size: 1.6rem;
}

.subtitle {
  margin: 4px 0 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

.kind-filter {
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-surface-50);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.group {
  margin-bottom: var(--space-4);
}

.group h2 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  margin: 0 0 var(--space-2);
}

.asset-list {
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: 0 var(--space-3);
}

.empty {
  color: #64748b;
  font-size: 0.9rem;
}
</style>
