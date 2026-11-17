<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectsStore } from '../stores/projects.js'
import { COLUMNS } from '../constants.js'
import { formatDay } from '../dates.js'
import AppShell from '../components/layout/AppShell.vue'
import AvatarStack from '../components/ui/AvatarStack.vue'
import BoardColumn from '../components/boards/BoardColumn.vue'
import NewDeliverableForm from '../components/deliverables/NewDeliverableForm.vue'
import TaskDetailPanel from '../components/boards/TaskDetailPanel.vue'

const store = useProjectsStore()
const route = useRoute()

const newTaskTitle = ref('')
const newTaskStatus = ref('todo')
const addingTask = ref(false)
const addingDeliverable = ref(false)

const deliverableOptions = computed(() =>
  store.activeProjectId ? store.deliverablesOf(store.activeProjectId) : []
)

const boardTasks = computed(() =>
  store.activeDeliverableId ? store.tasksOf(store.activeDeliverableId) : []
)

// owner / editor of a project that isn't archived
const canEdit = computed(() => store.activeProjectId !== null && store.canEditProject(store.activeProjectId))

// one entry per kanban column with its tasks
const columns = computed(() => COLUMNS.map((c) => ({ ...c, tasks: boardTasks.value.filter((t) => t.status === c.status) })))

const openTask = computed(() => {
  const id = Number(route.params.taskId)
  return id ? store.taskById(id) : null
})

const formatDate = (day) => formatDay(day, { withYear: true })

async function submitNewTask() {
  if (!newTaskTitle.value.trim() || !store.activeDeliverableId) return
  const result = await store.addTask(store.activeDeliverableId, newTaskTitle.value.trim(), newTaskStatus.value)
  if (!result.ok) return
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
        <div v-if="canEdit" class="action-buttons">
          <button type="button" class="secondary-btn" @click="addingDeliverable = !addingDeliverable">+ New deliverable</button>
          <button v-if="store.activeDeliverableId" type="button" class="add-task-btn" @click="addingTask = !addingTask">+ Add task</button>
        </div>
      </div>
    </header>

    <p v-if="!store.activeProject" class="hint">
      You are not in any project yet. <RouterLink to="/projects">Create or open a project</RouterLink> first.
    </p>

    <NewDeliverableForm
      v-if="canEdit && (addingDeliverable || !store.activeDeliverableId)"
      :project-id="store.activeProjectId"
      @created="addingDeliverable = false"
      @cancel="addingDeliverable = false"
    />
    <p v-else-if="store.activeProject && !store.activeDeliverableId" class="hint">
      This project has no deliverable yet. Ask an owner or an editor to create one.
    </p>

    <form v-if="addingTask" class="quick-add" @submit.prevent="submitNewTask">
      <input v-model="newTaskTitle" type="text" placeholder="Task title" maxlength="150" autofocus />
      <select v-model="newTaskStatus" aria-label="Column">
        <option v-for="c in COLUMNS" :key="c.status" :value="c.status">{{ c.title }}</option>
      </select>
      <button type="submit">Add</button>
      <button type="button" class="cancel" @click="addingTask = false">Cancel</button>
    </form>

    <div class="columns">
      <BoardColumn
        v-for="c in columns"
        :key="c.status"
        :title="c.title"
        :dot-color="c.color"
        :status="c.status"
        :tasks="c.tasks"
        :can-edit="canEdit && Boolean(store.activeDeliverableId)"
      />
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

.action-buttons {
  display: flex;
  gap: var(--space-2);
}

.secondary-btn {
  background: var(--color-surface-800);
  color: #cbd5e1;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
}

.hint {
  color: #94a3b8;
  font-size: 0.9rem;
  margin: 0 0 var(--space-4);
}

.quick-add select {
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 10px;
  color: var(--color-surface-50);
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

