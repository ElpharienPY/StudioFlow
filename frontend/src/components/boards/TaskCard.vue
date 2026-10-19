<script setup>
import { useRouter } from 'vue-router'
import { useProjectsStore } from '../../stores/projects.js'
import Avatar from '../ui/Avatar.vue'

const props = defineProps({
  task: { type: Object, required: true },
})

const store = useProjectsStore()
const router = useRouter()

function openTask() {
  router.push(`/boards/${props.task.id}`)
}

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <button type="button" class="task-card" @click="openTask">
    <h3>{{ task.title }}</h3>
    <div class="meta">
      <span v-if="task.stage" class="stage">{{ task.stage }}</span>
      <span class="comments" v-if="store.commentsOf(task.id).length">💬 {{ store.commentsOf(task.id).length }}</span>
    </div>
    <div class="bottom">
      <span class="due">{{ formatDate(task.due_date) }}</span>
      <Avatar v-if="store.userById(task.assignee_id)" :user="store.userById(task.assignee_id)" :size="22" />
    </div>
  </button>
</template>

<style scoped>
.task-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  text-align: left;
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  cursor: pointer;
  color: var(--color-surface-50);
}

.task-card:hover {
  border-color: var(--color-accent-500);
}

h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.stage {
  font-size: 0.72rem;
  color: #94a3b8;
  background: var(--color-surface-800);
  padding: 2px 8px;
  border-radius: 999px;
}

.comments {
  font-size: 0.72rem;
  color: #64748b;
}

.bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.due {
  font-size: 0.75rem;
  color: #64748b;
}
</style>
