<script setup>
import { useProjectsStore } from '../../stores/projects.js'

const props = defineProps({
  asset: { type: Object, required: true },
  isLatest: { type: Boolean, default: false },
  removable: { type: Boolean, default: false }, // editor+ on a non-archived project
})
const emit = defineEmits(['remove'])

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
      <a class="label" :href="asset.url" target="_blank" rel="noopener noreferrer">{{ asset.label }}</a>
      <div class="meta">{{ store.userById(asset.uploaded_by)?.full_name ?? 'Unknown' }} · {{ formatDate(asset.created_at) }}</div>
    </div>
    <span v-if="isLatest" class="latest">latest</span>
    <span class="version">v{{ asset.version }}</span>
    <button
      v-if="removable"
      type="button"
      class="remove"
      :title="`Delete ${asset.label} v${asset.version}`"
      :aria-label="`Delete ${asset.label} v${asset.version}`"
      @click="emit('remove')"
    >
      ✕
    </button>
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
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-surface-50);
  text-decoration: none;
}

.label:hover {
  color: var(--color-accent-400);
  text-decoration: underline;
}

.remove {
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-size: 0.75rem;
}

.remove:hover {
  color: #f87171;
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
