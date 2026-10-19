<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore, STAGE_ORDER } from '../../stores/projects.js'
import { useAuthStore } from '../../stores/auth.js'
import Avatar from '../ui/Avatar.vue'

const props = defineProps({
  task: { type: Object, required: true },
})

const store = useProjectsStore()
const auth = useAuthStore()
const router = useRouter()
const commentBody = ref('')

const STATUS_LABEL = { todo: 'To Do', doing: 'Doing', done: 'Done' }
const STATUS_DOT = { todo: '#fbbf24', doing: '#60a5fa', done: '#34d399' }

function close() {
  router.push('/boards')
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTime(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function submitComment() {
  if (!commentBody.value.trim() || !auth.currentUser) return
  store.addComment(props.task.id, auth.currentUser.id, commentBody.value.trim())
  commentBody.value = ''
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
          <dt>Assignee</dt>
          <dd>
            <template v-if="store.userById(task.assignee_id)">
              <Avatar :user="store.userById(task.assignee_id)" :size="22" />
              {{ store.userById(task.assignee_id).full_name }}
            </template>
            <template v-else>Unassigned</template>
          </dd>
        </div>
        <div class="field">
          <dt>Due date</dt>
          <dd>{{ formatDate(task.due_date) }}</dd>
        </div>
        <div class="field">
          <dt>Stage</dt>
          <dd>
            <select :value="task.stage ?? ''" @change="store.updateTaskStage(task.id, $event.target.value || null)">
              <option value="">—</option>
              <option v-for="s in STAGE_ORDER" :key="s" :value="s">{{ s }}</option>
            </select>
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
