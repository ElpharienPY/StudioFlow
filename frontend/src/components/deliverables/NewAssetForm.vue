<script setup>
import { ref } from 'vue'
import { useProjectsStore } from '../../stores/projects.js'
import { ASSET_KINDS } from '../../constants.js'

const props = defineProps({
  deliverableId: { type: Number, required: true },
})

const store = useProjectsStore()
const label = ref('')
const url = ref('')
const kind = ref('edit')
const saving = ref(false)

async function submit() {
  if (!label.value.trim() || !url.value.trim() || saving.value) return
  saving.value = true
  const result = await store.addAsset(props.deliverableId, { label: label.value.trim(), url: url.value.trim(), kind: kind.value })
  saving.value = false
  if (!result.ok) return
  label.value = ''
  url.value = ''
}
</script>

<template>
  <form class="new-asset" @submit.prevent="submit">
    <input v-model="label" type="text" placeholder="Label (e.g. Rough cut)" maxlength="150" required aria-label="Asset label" />
    <input v-model="url" type="url" placeholder="https://… (Drive, Frame.io, Dropbox)" required aria-label="Asset link" />
    <select v-model="kind" aria-label="Asset kind">
      <option v-for="k in ASSET_KINDS" :key="k" :value="k">{{ k.replace('_', ' ') }}</option>
    </select>
    <button type="submit" :disabled="saving">{{ saving ? 'Adding…' : 'Add asset' }}</button>
  </form>
</template>

<style scoped>
.new-asset {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-top: var(--space-3);
  margin-top: var(--space-2);
  border-top: 1px solid var(--color-border-subtle);
}

input,
select {
  background: var(--color-surface-950);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 7px 10px;
  color: var(--color-surface-50);
  font-size: 0.85rem;
}

input[type='text'] {
  flex: 1 1 140px;
}

input[type='url'] {
  flex: 2 1 200px;
}

select {
  text-transform: capitalize;
}

button {
  border: none;
  border-radius: var(--radius-md);
  padding: 7px 14px;
  cursor: pointer;
  font-weight: 600;
  background: var(--color-accent-500);
  color: white;
}

button:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
