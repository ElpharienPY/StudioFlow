<script setup>
import { useProjectsStore } from '../../stores/projects.js'

const props = defineProps({
  asset: { type: Object, required: true },
  isLatest: { type: Boolean, default: false },
})

const store = useProjectsStore()

const KIND_ICON = {
  script: '📄',
  raw_footage: '🎥',
  edit: '🎬',
  thumbnail: '🖼️',
  export: '📦',
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="asset-row">
    <span class="icon">{{ KIND_ICON[asset.kind] ?? '📁' }}</span>
    <div class="info">
      <div class="label">{{ asset.label }}</div>
      <div class="meta">{{ store.userById(asset.uploaded_by)?.full_name ?? 'Unknown' }} · {{ formatDate(asset.created_at) }}</div>
    </div>
    <span v-if="isLatest" class="latest">latest</span>
    <span class="version">v{{ asset.version }}</span>
  </div>
</template>

<style scoped>
.asset-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
}

.asset-row:last-child {
  border-bottom: none;
}

.icon {
  font-size: 1.1rem;
}

.info {
  flex: 1;
  min-width: 0;
}

.label {
  font-size: 0.9rem;
  font-weight: 600;
}

.meta {
  font-size: 0.78rem;
  color: #64748b;
}

.latest {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-accent-400);
  background: color-mix(in srgb, var(--color-accent-500) 18%, transparent);
  padding: 2px 8px;
  border-radius: 999px;
}

.version {
  font-size: 0.78rem;
  color: #94a3b8;
  background: var(--color-surface-800);
  padding: 2px 8px;
  border-radius: 999px;
}
</style>
