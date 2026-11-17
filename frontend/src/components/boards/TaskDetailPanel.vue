<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore, STAGE_ORDER } from '../../stores/projects.js'
import { useAuthStore } from '../../stores/auth.js'
import Avatar from '../ui/Avatar.vue'
import { formatDay } from '../../dates.js'

const props = defineProps({
  task: { type: Object, required: true },
})

const store = useProjectsStore()
const auth = useAuthStore()
const router = useRouter()
const commentBody = ref('')

const projectId = computed(() => store.deliverables.find((d) => d.id === props.task.deliverable_id)?.project_id ?? null)
const canEdit = computed(() => store.canEditProject(projectId.value))
const assignees = computed(() => store.assigneesOf(props.task))
// project members that can still be added to the task
const available = computed(() =>
  store.membersOf(projectId.value).filter((m) => !(props.task.assignee_ids ?? []).includes(m.id))
)

const STATUS_LABEL = { todo: 'To Do', doing: 'Doing', done: 'Done' }
const STATUS_DOT = { todo: '#fbbf24', doing: '#60a5fa', done: '#34d399' }

function close() {
  router.push('/boards')
}

const formatDate = (day) => formatDay(day, { withYear: true }) ?? '—'

function formatTime(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// comments are fetched when a task is opened (the board only carries their count)
watch(() => props.task.id, (id) => store.loadComments(id), { immediate: true })

function addAssignee(event) {
  const userId = Number(event.target.value)
  event.target.value = ''
  if (userId) store.assignMember(props.task.id, userId)
}

function moveTo(event) {
  store.updateTaskStatus(props.task.id, event.target.value)
}

async function removeTask() {
  if (!window.confirm(`Delete "${props.task.title}"? Its comments will be deleted too.`)) return
  const result = await store.deleteTask(props.task.id)
  if (result.ok) close()
}

async function submitComment() {
  const body = commentBody.value.trim()
  if (!body || !auth.currentUser) return
  const result = await store.addComment(props.task.id, body)
  if (result.ok) commentBody.value = ''
}
</script>

<template>
  <div class="overlay" @click.self="close">
    <aside class="panel">
      <header class="panel-head">
        <div class="badge">
          <span class="dot" :style="{ background: STATUS_DOT[task.status] }" />
          {{ STATUS_LABEL[task.status] }}
        </div>
        <span class="deliverable-name">{{ store.activeDeliverable?.title }} · TASK-{{ task.id }}</span>
        <button type="button" class="close" @click="close">✕</button>
      </header>

      <h1>{{ task.title }}</h1>

      <dl class="fields">
        <div class="field">
          <dt>Status</dt>
          <dd>
            <select v-if="canEdit" :value="task.status" @change="moveTo">
              <option v-for="(label, value) in STATUS_LABEL" :key="value" :value="value">{{ label }}</option>
            </select>
            <template v-else>{{ STATUS_LABEL[task.status] }}</template>
          </dd>
        </div>
        <div class="field">
          <dt>Assignees</dt>
          <dd class="assignees">
            <span v-for="u in assignees" :key="u.id" class="chip">
              <Avatar :user="u" :size="20" />
              {{ u.full_name }}
              <button
                v-if="canEdit"
                type="button"
                class="chip-remove"
                :title="`Remove ${u.full_name}`"
                :aria-label="`Remove ${u.full_name}`"
                @click="store.unassignMember(task.id, u.id)"
              >
                ✕
              </button>
            </span>
            <span v-if="!assignees.length" class="muted">Unassigned</span>
            <select v-if="canEdit && available.length" class="add-assignee" aria-label="Add an assignee" @change="addAssignee">
              <option value="">+ Add a person</option>
              <option v-for="m in available" :key="m.id" :value="m.id">{{ m.full_name }}</option>
            </select>
          </dd>
        </div>
        <div class="field">
          <dt>Due date</dt>
          <dd>{{ formatDate(task.due_date) }}</dd>
        </div>
        <div class="field">
          <dt>Stage</dt>
          <dd>
            <select
              v-if="canEdit"
              :value="task.stage ?? ''"
              @change="store.updateTaskStage(task.id, $event.target.value || null)"
            >
              <option value="">—</option>
              <option v-for="s in STAGE_ORDER" :key="s" :value="s">{{ s }}</option>
            </select>
            <template v-else>{{ task.stage ?? '—' }}</template>
          </dd>
        </div>
      </dl>

      <section v-if="task.description">
        <h2>Description</h2>
        <p class="description">{{ task.description }}</p>
      </section>

      <section class="comments-section">
        <h2>Comments <span class="count">{{ store.commentsOf(task.id).length }}</span></h2>
        <div class="comments">
          <div v-for="c in store.commentsOf(task.id)" :key="c.id" class="comment">
            <Avatar :user="store.userById(c.author_id)" :size="26" />
            <div class="comment-body">
              <div class="comment-head">
                <strong>{{ store.userById(c.author_id)?.full_name }}</strong>
                <span class="time">{{ formatTime(c.created_at) }}</span>
              </div>
              <p>{{ c.body }}</p>
            </div>
          </div>
        </div>

        <form class="add-comment" @submit.prevent="submitComment">
          <Avatar v-if="auth.currentUser" :user="auth.currentUser" :size="26" />
          <input v-model="commentBody" type="text" placeholder="Add a comment..." />
          <button type="submit">➤</button>
        </form>
      </section>

      <button v-if="canEdit" type="button" class="delete-task" @click="removeTask">Delete task</button>
    </aside>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: flex-end;
  z-index: 50;
}

.panel {
  width: min(480px, 100%);
  height: 100%;
  background: var(--color-surface-950);
  border-left: 1px solid var(--color-border-subtle);
  padding: var(--space-4) var(--space-6);
  overflow-y: auto;
}

.panel-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-surface-900);
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 0.78rem;
  font-weight: 600;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.deliverable-name {
  color: #64748b;
  font-size: 0.82rem;
  flex: 1;
}

.close {
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-surface-50);
  border-radius: var(--radius-md);
  width: 28px;
  height: 28px;
  cursor: pointer;
}

h1 {
  font-size: 1.3rem;
  margin: 0 0 var(--space-4);
}

.fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0 0 var(--space-4);
}

.field {
  display: grid;
  grid-template-columns: 110px 1fr;
  align-items: center;
  font-size: 0.88rem;
}

dt {
  color: #64748b;
}

dd {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

select {
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-surface-50);
  border-radius: var(--radius-md);
  padding: 4px 10px;
  font-size: 0.85rem;
}

dd.assignees {
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: 999px;
  padding: 2px 6px 2px 4px;
  font-size: 0.82rem;
}

.chip-remove {
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-size: 0.72rem;
  padding: 0 2px;
}

.chip-remove:hover {
  color: #f87171;
}

.muted {
  color: #64748b;
}

.delete-task {
  margin-top: var(--space-4);
  background: transparent;
  border: 1px solid #7f1d1d;
  color: #f87171;
  border-radius: var(--radius-md);
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.82rem;
}

.delete-task:hover {
  background: rgba(248, 113, 113, 0.1);
}

h2 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  margin: 0 0 var(--space-2);
}

.count {
  color: #64748b;
  font-weight: 400;
}

.description {
  margin: 0 0 var(--space-4);
  font-size: 0.9rem;
  line-height: 1.5;
  color: #cbd5e1;
}

.comments {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.comment {
  display: flex;
  gap: var(--space-2);
}

.comment-body {
  flex: 1;
}

.comment-head {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  font-size: 0.85rem;
}

.time {
  color: #64748b;
  font-size: 0.75rem;
}

.comment p {
  margin: 2px 0 0;
  font-size: 0.88rem;
  color: #cbd5e1;
}

.add-comment {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.add-comment input {
  flex: 1;
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  color: var(--color-surface-50);
  font-size: 0.85rem;
}

.add-comment button {
  background: var(--color-accent-500);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  width: 34px;
  height: 34px;
  cursor: pointer;
}
</style>

