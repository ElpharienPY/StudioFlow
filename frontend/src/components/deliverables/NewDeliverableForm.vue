<script setup>
import { ref } from 'vue'
import { useProjectsStore } from '../../stores/projects.js'
import { PLATFORMS } from '../../constants.js'

const props = defineProps({
  projectId: { type: Number, required: true },
})
const emit = defineEmits(['created', 'cancel'])

const store = useProjectsStore()
const title = ref('')
const platform = ref('youtube')
const publishDate = ref('')
const saving = ref(false)

async function submit() {
  const name = title.value.trim()
  if (!name || saving.value) return
  saving.value = true
  const result = await store.addDeliverable(props.projectId, name, {
    platform: platform.value,
    publish_date: publishDate.value || undefined,
  })
  saving.value = false
  if (!result.ok) return
  title.value = ''
  publishDate.value = ''
  emit('created', result.value)
}
</script>

<template>
  <form class="new-deliverable" @submit.prevent="submit">
    <input v-model="title" type="text" placeholder="Deliverable title (e.g. Launch trailer)" maxlength="150" required />
    <select v-model="platform" aria-label="Platform">
      <option v-for="p in PLATFORMS" :key="p" :value="p">{{ p }}</option>
    </select>
    <input v-model="publishDate" type="date" aria-label="Publish date" />
    <button type="submit" :disabled="saving">{{ saving ? 'Creating…' : 'Create deliverable' }}</button>
    <button type="button" class="cancel" @click="emit('cancel')">Cancel</button>
  </form>
</template>

<style scoped>
.new-deliverable {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

input,
select {
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  color: var(--color-surface-50);
  font-size: 0.88rem;
}

input[type='text'] {
  flex: 1;
  min-width: 220px;
  max-width: 360px;
}

select {
  text-transform: capitalize;
}

button {
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
  background: var(--color-accent-500);
  color: white;
}

button:disabled {
  opacity: 0.6;
  cursor: default;
}

.cancel {
  background: var(--color-surface-800);
  color: #94a3b8;
}
</style>
