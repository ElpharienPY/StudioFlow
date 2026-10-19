<script setup>
import { ref } from 'vue'
import { useProjectsStore } from '../../stores/projects.js'

const props = defineProps({
  projectId: { type: Number, required: true },
})

const store = useProjectsStore()
const email = ref('')
const role = ref('editor')
const error = ref('')
const success = ref('')

function submit() {
  error.value = ''
  success.value = ''
  const result = store.inviteMember(props.projectId, email.value.trim(), role.value)
  if (!result.ok) {
    error.value = result.error
    return
  }
  success.value = `Added to the project.`
  email.value = ''
}
</script>

<template>
  <div>
    <form class="invite-form" @submit.prevent="submit">
      <input v-model="email" type="email" placeholder="teammate@studioflow.co" required />
      <select v-model="role">
        <option value="editor">Editor</option>
        <option value="viewer">Viewer</option>
        <option value="owner">Owner</option>
      </select>
      <button type="submit">Invite</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>
  </div>
</template>

<style scoped>
.invite-form {
  display: flex;
  gap: var(--space-2);
}

.invite-form input {
  flex: 1;
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  color: var(--color-surface-50);
  font-size: 0.85rem;
}

.invite-form select {
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-surface-50);
  border-radius: var(--radius-md);
  padding: 8px 10px;
  font-size: 0.85rem;
}

.invite-form button {
  background: var(--color-accent-500);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
}

.invite-form button:hover {
  background: var(--color-accent-600);
}

.error {
  color: #fca5a5;
  font-size: 0.82rem;
  margin: var(--space-2) 0 0;
}

.success {
  color: #6ee7b7;
  font-size: 0.82rem;
  margin: var(--space-2) 0 0;
}
</style>
