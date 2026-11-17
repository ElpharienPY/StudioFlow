<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '../stores/projects.js'
import AppShell from '../components/layout/AppShell.vue'
import AvatarStack from '../components/ui/AvatarStack.vue'
import StatusPill from '../components/ui/StatusPill.vue'
import ProgressBar from '../components/ui/ProgressBar.vue'

const store = useProjectsStore()
const router = useRouter()
const search = ref('')

const matches = (p) => p.name.toLowerCase().includes(search.value.toLowerCase())
const filtered = computed(() => store.activeProjects.filter(matches))
const filteredArchived = computed(() => store.archivedProjects.filter(matches))

const creating = ref(false)
const newName = ref('')
const saving = ref(false)

function startNewProject() {
  newName.value = ''
  creating.value = true
}

async function submitNewProject() {
  const name = newName.value.trim()
  if (!name || saving.value) return
  saving.value = true
  const result = await store.createProject(name)
  saving.value = false
  if (result.ok) {
    creating.value = false
    router.push('/deliverables')
  }
}

// archiving is reversible (the project becomes read-only); deleting is only offered once archived
async function archiveProject(project) {
  if (!window.confirm(`Archive "${project.name}"? It becomes read-only until you restore it.`)) return
  await store.setArchived(project.id, true)
}

async function restoreProject(project) {
  await store.setArchived(project.id, false)
}

async function removeProject(project) {
  const ok = window.confirm(`Delete "${project.name}" permanently? Its deliverables, tasks, comments and assets will be lost.`)
  if (!ok) return
  await store.deleteProject(project.id)
}

function openProject(projectId) {
  store.setActiveProject(projectId)
  router.push('/deliverables')
}
</script>

<template>
  <AppShell>
    <header class="header">
      <div>
        <h1>Projects</h1>
        <p class="subtitle">{{ store.activeProjects.length }} active · {{ store.archivedProjects.length }} archived</p>
      </div>
      <div class="actions">
        <input v-model="search" type="search" placeholder="Search projects" class="search" />
        <button type="button" class="new-btn" @click="startNewProject">+ New project</button>
      </div>
    </header>

    <form v-if="creating" class="create-form" @submit.prevent="submitNewProject">
      <input v-model="newName" type="text" placeholder="Project name" maxlength="150" autofocus required />
      <button type="submit" :disabled="saving">{{ saving ? 'Creating…' : 'Create' }}</button>
      <button type="button" class="cancel" @click="creating = false">Cancel</button>
    </form>

    <div class="grid">
      <button type="button" class="new-card" @click="startNewProject">
        <span class="plus">+</span>
        <span>New project</span>
      </button>

      <article v-for="p in filtered" :key="p.id" class="card" @click="openProject(p.id)">
        <div class="card-top">
          <span class="emoji">🎬</span>
          <div class="card-top-right">
            <StatusPill :status="p.health_status" :label="store.statusLabel(p.health_status)" />
            <button
              v-if="p.role === 'owner'"
              type="button"
              class="archive-btn"
              title="Archive project"
              aria-label="Archive project"
              @click.stop="archiveProject(p)"
            >
              🗄
            </button>
          </div>
        </div>
        <h2>{{ p.name }}</h2>
        <p class="description">{{ p.description }}</p>
        <div class="card-bottom">
          <AvatarStack :users="store.membersOf(p.id)" :size="26" />
          <span class="count">{{ store.projectProgress(p.id).done }}/{{ store.projectProgress(p.id).total }}</span>
        </div>
        <ProgressBar
          :value="
            store.projectProgress(p.id).total
              ? (100 * store.projectProgress(p.id).done) / store.projectProgress(p.id).total
              : 0
          "
        />
      </article>
    </div>

    <section v-if="filteredArchived.length" class="archived">
      <h2>Archived <span class="count">{{ filteredArchived.length }}</span></h2>
      <p class="archived-note">Archived projects are read-only. Owners can restore them or delete them for good.</p>
      <div v-for="p in filteredArchived" :key="p.id" class="archived-row" @click="openProject(p.id)">
        <span class="archived-name">{{ p.name }}</span>
        <span class="archived-role">{{ p.role }}</span>
        <template v-if="p.role === 'owner'">
          <button type="button" class="restore-btn" @click.stop="restoreProject(p)">Restore</button>
          <button type="button" class="delete-btn" title="Delete permanently" aria-label="Delete permanently" @click.stop="removeProject(p)">
            🗑
          </button>
        </template>
      </div>
    </section>
  </AppShell>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
  gap: var(--space-4);
  flex-wrap: wrap;
}

h1 {
  margin: 0;
  font-size: 1.6rem;
}

.subtitle {
  margin: 4px 0 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

.actions {
  display: flex;
  gap: var(--space-2);
}

.search {
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  color: var(--color-surface-50);
  font-size: 0.85rem;
  width: 200px;
}

.new-btn {
  background: var(--color-accent-500);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.new-btn:hover {
  background: var(--color-accent-600);
}

.create-form {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.create-form input {
  flex: 1;
  max-width: 420px;
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  color: var(--color-surface-50);
}

.create-form button {
  background: var(--color-accent-500);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
}

.create-form .cancel {
  background: transparent;
  color: #94a3b8;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-4);
}

.new-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 190px;
  border: 1px dashed var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-weight: 600;
}

.new-card:hover {
  border-color: var(--color-accent-500);
  color: var(--color-accent-400);
}

.plus {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-surface-800);
  font-size: 1.1rem;
}

.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  text-align: left;
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  cursor: pointer;
}

.card:hover {
  border-color: var(--color-accent-500);
}

.card-top-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.delete-btn {
  background: transparent;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  width: 28px;
  height: 28px;
  cursor: pointer;
  color: #f87171;
}

.delete-btn:hover {
  border-color: #7f1d1d;
  background: rgba(248, 113, 113, 0.1);
}

.archive-btn {
  background: transparent;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  width: 28px;
  height: 28px;
  cursor: pointer;
}

.archive-btn:hover {
  border-color: var(--color-accent-500);
}

.archived {
  margin-top: var(--space-6);
}

.archived h2 {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.archived-note {
  margin: 4px 0 var(--space-3);
  color: #64748b;
  font-size: 0.82rem;
}

.archived-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
  cursor: pointer;
  color: #94a3b8;
}

.archived-row:hover {
  border-color: var(--color-accent-500);
}

.archived-name {
  flex: 1;
  font-weight: 600;
}

.archived-role {
  font-size: 0.75rem;
  text-transform: capitalize;
}

.restore-btn {
  background: var(--color-surface-800);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-surface-50);
  border-radius: var(--radius-md);
  padding: 4px 12px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
}

.restore-btn:hover {
  border-color: var(--color-accent-500);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.emoji {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--color-surface-800);
  font-size: 1rem;
}

h2 {
  margin: 0;
  font-size: 1.05rem;
}

.description {
  margin: 0;
  color: #94a3b8;
  font-size: 0.85rem;
  flex: 1;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.count {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 600;
}
</style>
