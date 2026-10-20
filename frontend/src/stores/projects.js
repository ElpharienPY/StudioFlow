import { reactive } from 'vue'
import {
  projects as seedProjects,
  projectMembers as seedProjectMembers,
  deliverables as seedDeliverables,
  tasks as seedTasks,
  comments as seedComments,
  assets as seedAssets,
  users as seedUsers,
  STAGE_ORDER,
} from '../data/fixtures.js'

const STATUS_LABEL = {
  kickoff: 'Kickoff',
  in_production: 'In production',
  almost_done: 'Almost done',
  on_track: 'On track',
}

// Plain Vue reactivity (no Pinia): see stores/auth.js for why. `get`
// accessors below replace Pinia's parameterless getters; the ones that used
// to be curried ("getter returning a function") are now just plain methods —
// call sites (`store.membersOf(id)`) read identically either way.
const store = reactive({
  projects: [...seedProjects],
  projectMembers: [...seedProjectMembers],
  deliverables: [...seedDeliverables],
  tasks: [...seedTasks],
  comments: [...seedComments],
  assets: [...seedAssets],
  users: [...seedUsers],
  activeProjectId: seedProjects.find((p) => !p.archived_at)?.id ?? null,
  activeDeliverableId: seedDeliverables.find((d) => d.project_id === seedProjects[0]?.id)?.id ?? null,
  nextTaskId: Math.max(...seedTasks.map((t) => t.id)) + 1,
  nextCommentId: Math.max(...seedComments.map((c) => c.id)) + 1,

  get activeProjects() {
    return store.projects.filter((p) => !p.archived_at)
  },
  get archivedProjects() {
    return store.projects.filter((p) => p.archived_at)
  },
  get activeProject() {
    return store.projects.find((p) => p.id === store.activeProjectId) ?? null
  },
  get activeDeliverable() {
    return store.deliverables.find((d) => d.id === store.activeDeliverableId) ?? null
  },

  taskById(taskId) {
    return store.tasks.find((t) => t.id === taskId) ?? null
  },

  statusLabel(status) {
    return STATUS_LABEL[status] ?? status
  },

  membersOf(projectId) {
    return store.projectMembers
      .filter((pm) => pm.project_id === projectId)
      .map((pm) => ({ ...store.users.find((u) => u.id === pm.user_id), role: pm.role }))
  },

  deliverablesOf(projectId) {
    return store.deliverables.filter((d) => d.project_id === projectId)
  },

  tasksOf(deliverableId) {
    return store.tasks.filter((t) => t.deliverable_id === deliverableId)
  },

  commentsOf(taskId) {
    return store.comments.filter((c) => c.task_id === taskId)
  },

  assetsOf(deliverableId) {
    return store.assets.filter((a) => a.deliverable_id === deliverableId)
  },

  userById(userId) {
    return store.users.find((u) => u.id === userId) ?? null
  },

  roleOf(projectId, userId) {
    return store.projectMembers.find((pm) => pm.project_id === projectId && pm.user_id === userId)?.role ?? null
  },

  // tasks' status drives the counts; stage drives the production stepper (see deliverableStage)
  projectProgress(projectId) {
    const deliverableIds = store.deliverables.filter((d) => d.project_id === projectId).map((d) => d.id)
    const projectTasks = store.tasks.filter((t) => deliverableIds.includes(t.deliverable_id))
    const done = projectTasks.filter((t) => t.status === 'done').length
    return { done, total: projectTasks.length }
  },

  // a deliverable's current stage is derived from its tasks, not stored (see db/schema.sql)
  deliverableStage(deliverableId) {
    const deliverableTasks = store.tasks.filter((t) => t.deliverable_id === deliverableId && t.stage)
    if (deliverableTasks.length === 0) return STAGE_ORDER[0]
    const furthest = Math.max(...deliverableTasks.map((t) => STAGE_ORDER.indexOf(t.stage)))
    return STAGE_ORDER[furthest]
  },

  setActiveProject(projectId) {
    store.activeProjectId = projectId
    store.activeDeliverableId = store.deliverables.find((d) => d.project_id === projectId)?.id ?? null
  },

  setActiveDeliverable(deliverableId) {
    store.activeDeliverableId = deliverableId
  },

  addTask(deliverableId, title) {
    const columnTasks = store.tasks.filter((t) => t.deliverable_id === deliverableId && t.status === 'todo')
    store.tasks.push({
      id: store.nextTaskId++,
      deliverable_id: deliverableId,
      assignee_id: null,
      title,
      description: '',
      status: 'todo',
      stage: null,
      due_date: null,
      position: columnTasks.length,
    })
  },

  updateTaskStage(taskId, stage) {
    const task = store.tasks.find((t) => t.id === taskId)
    if (task) task.stage = stage
  },

  updateTaskStatus(taskId, status) {
    const task = store.tasks.find((t) => t.id === taskId)
    if (task) task.status = status
  },

  addComment(taskId, authorId, body) {
    store.comments.push({ id: store.nextCommentId++, task_id: taskId, author_id: authorId, body, created_at: new Date().toISOString() })
  },

  inviteMember(projectId, email, role) {
    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user) return { ok: false, error: 'No account with this email yet — they need to sign up first.' }
    if (store.projectMembers.some((pm) => pm.project_id === projectId && pm.user_id === user.id)) {
      return { ok: false, error: `${user.full_name} is already a member of this project.` }
    }
    store.projectMembers.push({ project_id: projectId, user_id: user.id, role, joined_at: new Date().toISOString() })
    return { ok: true }
  },

  updateMemberRole(projectId, userId, role) {
    const pm = store.projectMembers.find((m) => m.project_id === projectId && m.user_id === userId)
    if (pm) pm.role = role
  },

  removeMember(projectId, userId) {
    const index = store.projectMembers.findIndex((pm) => pm.project_id === projectId && pm.user_id === userId)
    if (index !== -1) store.projectMembers.splice(index, 1)
  },
})

export function useProjectsStore() {
  return store
}

export { STAGE_ORDER }
