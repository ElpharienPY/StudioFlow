<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectsStore } from '../stores/projects.js'
import AppShell from '../components/layout/AppShell.vue'
import AvatarStack from '../components/ui/AvatarStack.vue'
import BoardColumn from '../components/boards/BoardColumn.vue'
import TaskDetailPanel from '../components/boards/TaskDetailPanel.vue'

const store = useProjectsStore()
const route = useRoute()

const newTaskTitle = ref('')
const addingTask = ref(false)

const deliverableOptions = computed(() =>
  store.activeProjectId ? store.deliverablesOf(store.activeProjectId) : []
)

const boardTasks = computed(() =>
  store.activeDeliverableId ? store.tasksOf(store.activeDeliverableId) : []
)

const todoTasks = computed(() => boardTasks.value.filter((t) => t.status === 'todo'))
const doingTasks = computed(() => boardTasks.value.filter((t) => t.status === 'doing'))
const doneTasks = computed(() => boardTasks.value.filter((t) => t.status === 'done'))

const openTask = computed(() => {
  const id = Number(route.params.taskId)
  return id ? store.taskById(id) : null
})

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function submitNewTask() {
  if (!newTaskTitle.value.trim() || !store.activeDeliverableId) return
  store.addTask(store.activeDeliverableId, newTaskTitle.value.trim())
  newTaskTitle.value = ''
  addingTask.value = false
}
</script>

<template>
  <AppShell>
    <p class="breadcrumb">{{ store.activeProject?.name }} / Deliverables</p>

    <header class="header">
      <div class="title-row">
        <h1>{{ store.activeDeliverable?.title ?? 'No deliverable yet' }}</h1>
        <select
          v-if="deliverableOptions.length > 1"
          class="deliverable-switch"
          :value="store.activeDeliverableId"
          @change="store.setActiveDeliverable(Number($event.target.value))"
        >
          <option v-for="d in deliverableOptions" :key="d.id" :value="d.id">{{ d.title }}</option>
        </select>
      </div>

      <div v-if="store.activeDeliverable" class="subheader">
        <span class="platform">{{ store.activeDeliverable.platform }}</span>
        <span v-if="store.activeDeliverable.publish_date">
          Publishes <strong>{{ formatDate(store.activeDeliverable.publish_date) }}</strong>
        </span>
        <span class="revision">Revision round {{ store.activeDeliverable.revision_round }}</span>
      </div>

      <div class="actions">
        <AvatarStack v-if="store.activeProjectId" :users="store.membersOf(store.activeProjectId)" :size="28" />
        <button type="button" class="add-task-btn" @click="addingTask = !addingTask">+ Add task</button>
      </div>
    </header>

    <form v-if="addingTask" class="quick-add" @submit.prevent="submitNewTask">
      <input v-model="newTaskTitle" type="text" placeholder="Task title" autofocus />
      <button type="submit">Add</button>
      <button type="button" class="cancel" @click="addingTask = false">Cancel</button>
    </form>

    <div class="columns">
      <BoardColumn title="To Do" dot-color="#fbbf24" :tasks="todoTasks" />
      <BoardColumn title="Doing" dot-color="#60a5fa" :tasks="doingTasks" />
      <BoardColumn title="Done" dot-color="#34d399" :tasks="doneTasks" />
    </div>

    <TaskDetailPanel v-if="openTask" :task="openTask" />
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
}

h1 {
  margin: 0;
  font-size: 1.5rem;
}

.deliverable-switch {
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-surface-50);
  border-radius: var(--radius-md);
  padding: 4px 10px;
  font-size: 0.82rem;
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

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-3);
}

.add-task-btn {
  background: var(--color-accent-500);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
}

.add-task-btn:hover {
  background: var(--color-accent-600);
}

.quick-add {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.quick-add input {
  flex: 1;
  max-width: 320px;
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  color: var(--color-surface-50);
}

.quick-add button {
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
}

.quick-add button[type='submit'] {
  background: var(--color-accent-500);
  color: white;
}

.quick-add .cancel {
  background: var(--color-surface-800);
  color: #94a3b8;
}

.columns {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
}
</style>

