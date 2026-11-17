<script setup>
import { useRouter } from 'vue-router'
import { useProjectsStore } from '../../stores/projects.js'
import AvatarStack from '../ui/AvatarStack.vue'
import { formatDay } from '../../dates.js'

const props = defineProps({
  task: { type: Object, required: true },
  movable: { type: Boolean, default: false }, // can be dragged to another column
})

const store = useProjectsStore()
const router = useRouter()

function openTask() {
  router.push(`/boards/${props.task.id}`)
}

function onDragStart(event) {
  event.dataTransfer.setData('text/plain', String(props.task.id))
  event.dataTransfer.effectAllowed = 'move'
}

const formatDate = (day) => formatDay(day)
</script>

<template>
  <div
    class="task-card"
    role="button"
    tabindex="0"
    :draggable="movable"
    @dragstart="onDragStart"
    @click="openTask"
    @keydown.enter="openTask"
  >
    <h3>{{ task.title }}</h3>
    <div class="meta">
      <span v-if="task.stage" class="stage">{{ task.stage }}</span>
      <span class="comments" v-if="task.comment_count">💬 {{ task.comment_count }}</span>
    </div>
    <div class="bottom">
      <span class="due">{{ formatDate(task.due_date) }}</span>
      <AvatarStack :users="store.assigneesOf(task)" :size="22" />
    </div>
  </div>
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
  font: inherit;
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

