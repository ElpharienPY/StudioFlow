<script setup>
import Avatar from '../ui/Avatar.vue'

const props = defineProps({
  member: { type: Object, required: true }, // user fields + role
  canManage: { type: Boolean, default: false },
  canRemove: { type: Boolean, default: false },
})

const emit = defineEmits(['change-role', 'remove'])
</script>

<template>
  <div class="row">
    <Avatar :user="member" :size="36" />
    <div class="info">
      <div class="name">{{ member.full_name }}</div>
      <div class="email">{{ member.email }}</div>
    </div>

    <select
      v-if="canManage"
      class="role-select"
      :value="member.role"
      @change="emit('change-role', $event.target.value)"
    >
      <option value="owner">Owner</option>
      <option value="editor">Editor</option>
      <option value="viewer">Viewer</option>
    </select>
    <span v-else class="role-badge" :class="member.role">{{ member.role }}</span>

    <button v-if="canManage && canRemove" type="button" class="remove" title="Remove from project" @click="emit('remove')">
      ✕
    </button>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 600;
  font-size: 0.92rem;
}

.email {
  color: #64748b;
  font-size: 0.8rem;
}

.role-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--color-surface-800);
  color: #94a3b8;
  text-transform: capitalize;
}

.role-badge.owner {
  color: var(--color-accent-400);
  background: color-mix(in srgb, var(--color-accent-500) 18%, transparent);
}

.role-select {
  background: var(--color-surface-950);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-surface-50);
  border-radius: var(--radius-md);
  padding: 5px 10px;
  font-size: 0.82rem;
  text-transform: capitalize;
}

.remove {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 4px 6px;
}

.remove:hover {
  color: #fca5a5;
}
</style>
