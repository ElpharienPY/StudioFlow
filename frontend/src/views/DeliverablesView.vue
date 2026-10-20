<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '../stores/projects.js'
import AppShell from '../components/layout/AppShell.vue'
import ProductionStepper from '../components/deliverables/ProductionStepper.vue'
import AssetRow from '../components/deliverables/AssetRow.vue'

const store = useProjectsStore()
const router = useRouter()

const deliverableOptions = computed(() =>
  store.activeProjectId ? store.deliverablesOf(store.activeProjectId) : []
)

const deliverable = computed(() => store.activeDeliverable)

const stage = computed(() => (deliverable.value ? store.deliverableStage(deliverable.value.id) : null))

const deliverableAssets = computed(() => (deliverable.value ? store.assetsOf(deliverable.value.id) : []))
const latestAssetId = computed(() => {
  if (!deliverableAssets.value.length) return null
  return deliverableAssets.value.reduce((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b)).id
})

const deliverableTasks = computed(() => (deliverable.value ? store.tasksOf(deliverable.value.id) : []))
const taskSummary = computed(() => ({
  todo: deliverableTasks.value.filter((t) => t.status === 'todo').length,
  doing: deliverableTasks.value.filter((t) => t.status === 'doing').length,
  done: deliverableTasks.value.filter((t) => t.status === 'done').length,
}))
const overallProgress = computed(() => {
  const total = deliverableTasks.value.length
  return total ? Math.round((100 * taskSummary.value.done) / total) : 0
})

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function openBoard() {
  router.push('/boards')
}
</script>

<template>
  <AppShell>
    <p class="breadcrumb">{{ store.activeProject?.name }} / {{ deliverable?.title }}</p>

    <header class="header">
      <div class="title-row">
        <h1>{{ deliverable?.title ?? 'No deliverable yet' }}</h1>
        <select
          v-if="deliverableOptions.length > 1"
          class="deliverable-switch"
          :value="store.activeDeliverableId"
          @change="store.setActiveDeliverable(Number($event.target.value))"
        >
          <option v-for="d in deliverableOptions" :key="d.id" :value="d.id">{{ d.title }}</option>
        </select>
        <button type="button" class="open-board" @click="openBoard">Open board →</button>
      </div>

      <div v-if="deliverable" class="subheader">
        <span class="platform">{{ deliverable.platform }}</span>
        <span v-if="deliverable.publish_date">Publishes <strong>{{ formatDate(deliverable.publish_date) }}</strong></span>
        <span class="revision">Revision round {{ deliverable.revision_round }}</span>
      </div>
    </header>

    <ProductionStepper v-if="stage" :current-stage="stage" class="section" />

    <div class="content-grid">
      <section class="assets section">
        <h2>Assets <span class="count">{{ deliverableAssets.length }} files</span></h2>
        <div class="asset-list">
          <AssetRow
            v-for="a in deliverableAssets"
            :key="a.id"
            :asset="a"
            :is-latest="a.id === latestAssetId"
          />
          <p v-if="!deliverableAssets.length" class="empty">No assets uploaded yet.</p>
        </div>
      </section>

      <aside class="summary section">
        <h2>Task summary</h2>
        <div class="summary-row"><span class="dot todo" />To Do <strong>{{ taskSummary.todo }}</strong></div>
        <div class="summary-row"><span class="dot doing" />Doing <strong>{{ taskSummary.doing }}</strong></div>
        <div class="summary-row"><span class="dot done" />Done <strong>{{ taskSummary.done }}</strong></div>
        <div class="progress-block">
          <div class="progress-row"><span>Overall progress</span><strong>{{ overallProgress }}%</strong></div>
          <div class="track"><div class="fill" :style="{ width: overallProgress + '%' }" /></div>
        </div>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.breadcrumb {
  margin: 0 0 var(--space-2);
  color: #64748b;
  font-size: 0.85rem;
}

.header {
  margin-bottom: var(--space-4);
}

.title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.deliverable-switch {
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-surface-50);
  border-radius: var(--radius-md);
  padding: 4px 10px;
  font-size: 0.82rem;
}

.open-board {
  margin-left: auto;
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-surface-50);
  border-radius: var(--radius-md);
  padding: 7px 14px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.open-board:hover {
  border-color: var(--color-accent-500);
  color: var(--color-accent-400);
}

.subheader {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: #94a3b8;
  font-size: 0.88rem;
  margin-top: 6px;
}

.platform {
  text-transform: capitalize;
  color: var(--color-accent-400);
  font-weight: 600;
}

.revision {
  background: var(--color-surface-800);
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
}

.section {
  margin-bottom: var(--space-4);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--space-4);
  align-items: start;
}

.assets,
.summary {
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

h2 {
  margin: 0 0 var(--space-3);
  font-size: 0.95rem;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.count {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 400;
}

.empty {
  color: #64748b;
  font-size: 0.85rem;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.88rem;
  padding: 6px 0;
  color: #cbd5e1;
}

.summary-row strong {
  margin-left: auto;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.todo {
  background: #fbbf24;
}

.dot.doing {
  background: #60a5fa;
}

.dot.done {
  background: #34d399;
}

.progress-block {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-subtle);
}

.progress-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
  margin-bottom: 6px;
}

.track {
  height: 6px;
  border-radius: 999px;
  background: var(--color-surface-800);
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--color-accent-500);
}

@media (max-width: 780px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
