<script setup>
import { ref } from 'vue'
import TaskCard from './TaskCard.vue'
import { useProjectsStore } from '../../stores/projects.js'

const props = defineProps({
  title: { type: String, required: true },
  dotColor: { type: String, required: true },
  status: { type: String, required: true }, // 'todo' | 'doing' | 'done': the column a new / dropped task goes to
  tasks: { type: Array, required: true },
  canEdit: { type: Boolean, default: false }, // owner / editor of a non-archived project
})

const store = useProjectsStore()
const adding = ref(false)
const newTitle = ref('')
const saving = ref(false)
const dragOver = ref(false)

async function submit() {
  const title = newTitle.value.trim()
  if (!title || saving.value || !store.activeDeliverableId) return
  saving.value = true
  const result = await store.addTask(store.activeDeliverableId, title, props.status)
  saving.value = false
  // keep the form open so several tasks can be added in a row
  if (result.ok) newTitle.value = ''
}

function cancel() {
  adding.value = false
  newTitle.value = ''
}

// drag & drop: a task card dropped here moves to this column (bottom)
function onDrop(event) {
  dragOver.value = false
  if (!props.canEdit) return
  const taskId = Number(event.dataTransfer.getData('text/plain'))
  const task = store.taskById(taskId)
  if (!task || task.status === props.status) return
  store.updateTaskStatus(taskId, props.status)
}
</script>

<template>
  <div
    class="column"
    :class="{ 'drag-over': dragOver }"
    @dragover.prevent="canEdit && (dragOver = true)"
    @dragleave="dragOver = false"
    @drop.prevent="onDrop"
  >
    <div class="column-head">
      <span class="dot" :style="{ background: dotColor }" />
      <h2>{{ title }}</h2>
      <span class="count">{{ tasks.length }}</span>
      <button
        v-if="canEdit && store.activeDeliverableId"
        type="button"
        class="add"
        :title="`Add a task to ${title}`"
        :aria-label="`Add a task to ${title}`"
        @click="adding = !adding"
      >
        +
      </button>
    </div>

    <form v-if="adding" class="quick-add" @submit.prevent="submit">
      <input v-model="newTitle" type="text" placeholder="Task title" maxlength="150" autofocus @keydown.esc="cancel" />
      <div class="quick-add-buttons">
        <button type="submit" :disabled="saving">Add</button>
        <button type="button" class="cancel" @click="cancel">Done</button>
      </div>
    </form>

    <div class="tasks">
      <TaskCard v-for="task in tasks" :key="task.id" :task="task" :movable="canEdit" />
      <p v-if="!tasks.length && !adding" class="empty">No task here yet</p>
    </div>
  </div>
</template>

<style scoped>
.column {
  flex: 1;
  min-width: 260px;
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.column.drag-over {
  border-color: var(--color-accent-500);
}

.column-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

h2 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  flex: 1;
}

.count {
  font-size: 0.75rem;
  color: #64748b;
  background: var(--color-surface-800);
  padding: 1px 8px;
  border-radius: 999px;
}

.add {
  width: 24px;
  height: 24px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-surface-800);
  color: var(--color-surface-50);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}

.add:hover {
  border-color: var(--color-accent-500);
}

.quick-add {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.quick-add input {
  background: var(--color-surface-950);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 10px;
  color: var(--color-surface-50);
  font-size: 0.88rem;
}

.quick-add-buttons {
  display: flex;
  gap: var(--space-2);
}

.quick-add button {
  border: none;
  border-radius: var(--radius-md);
  padding: 6px 12px;
  cursor: pointer;
  font-weight: 600;
  background: var(--color-accent-500);
  color: white;
}

.quick-add button:disabled {
  opacity: 0.6;
  cursor: default;
}

.quick-add .cancel {
  background: var(--color-surface-800);
  color: #94a3b8;
}

.tasks {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 24px;
}

.empty {
  margin: 0;
  color: #475569;
  font-size: 0.8rem;
  text-align: center;
}
</style>
