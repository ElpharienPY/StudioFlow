import { reactive } from 'vue'
import { api } from '../api.js'
import { STAGE_ORDER } from '../constants.js'
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

const ACTIVE_PROJECT_KEY = 'studioflow.activeProject'

// Plain Vue reactivity (no Pinia): see stores/auth.js for why. `get`
// accessors below replace Pinia's parameterless getters; the ones that used
// to be curried ("getter returning a function") are now just plain methods —
// call sites (`store.membersOf(id)`) read identically either way.
//
// The data now comes from the REST API (backend/README.md). Reads stay synchronous (views read
// `store.tasksOf(id)` etc.); loading is done by the `load*` actions below, and every write
// calls the API first, then updates the local state with what the server answered.
const store = reactive({
  projects: [], // each project carries `members[]`, `role` (mine) and `progress {done,total}` from the API
  deliverables: [],
  tasks: [],
  comments: [],
  assets: [],
  users: [], // everybody we've seen (project members, comment authors) so userById() can resolve ids
  activeProjectId: null,
  activeDeliverableId: null,
  loading: false,
  error: '', // last failed write, shown by AppShell
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
    return store.projects.find((p) => p.id === projectId)?.members ?? []
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

  // the people working on a task, as user objects (ids we don't know yet are skipped)
  assigneesOf(task) {
    return (task?.assignee_ids ?? []).map((id) => store.userById(id)).filter(Boolean)
  },

  // can I create / edit / move tasks in this project? (owner or editor, and not archived)
  canEditProject(projectId) {
    const project = store.projects.find((p) => p.id === projectId)
    return Boolean(project && !project.archived_at && ['owner', 'editor'].includes(project.role))
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
    return store.membersOf(projectId).find((m) => m.id === userId)?.role ?? null
  },

  // tasks' status drives the counts (computed by the API); stage drives the production stepper (see deliverableStage)
  projectProgress(projectId) {
    return store.projects.find((p) => p.id === projectId)?.progress ?? { done: 0, total: 0 }
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

  // ---------- loading ----------

  // forget everything (sign-in as someone else, sign-out)
  reset() {
    store.projects = []
    store.deliverables = []
    store.tasks = []
    store.comments = []
    store.assets = []
    store.users = []
    store.activeProjectId = null
    store.activeDeliverableId = null
    store.error = ''
    loadedOnce = null
  },

  // load the project list (+ the active project's content) once per session; safe to call from every route
  ensureLoaded() {
    loadedOnce ??= store.loadProjects().catch((err) => {
      loadedOnce = null
      store.error = err.message
    })
    return loadedOnce
  },

  async loadProjects() {
    store.loading = true
    try {
      const { projects } = await api.get('/projects')
      store.projects = projects
      projects.forEach((p) => store.registerUsers(p.members))

      let saved = null
      try {
        saved = Number(localStorage.getItem(ACTIVE_PROJECT_KEY)) || null
      } catch {
        // storage unavailable: fall back to the first project
      }
      const current = store.projects.find((p) => p.id === (store.activeProjectId ?? saved))
      const first = current ?? store.activeProjects[0] ?? null
      store.activeProjectId = first?.id ?? null
      if (first) await store.loadProject(first.id)
    } finally {
      store.loading = false
    }
  },

  // deliverables + their tasks and assets for one project
  async loadProject(projectId) {
    const { deliverables } = await api.get(`/projects/${projectId}/deliverables`)
    const content = await Promise.all(
      deliverables.map(async (d) => {
        const [{ tasks }, { assets }] = await Promise.all([
          api.get(`/deliverables/${d.id}/tasks`),
          api.get(`/deliverables/${d.id}/assets`),
        ])
        return { tasks, assets }
      })
    )
    // the user may have switched project while we were loading
    if (store.activeProjectId !== projectId) return

    const ids = new Set(deliverables.map((d) => d.id))
    store.deliverables = [...store.deliverables.filter((d) => d.project_id !== projectId), ...deliverables]
    store.tasks = [...store.tasks.filter((t) => !ids.has(t.deliverable_id)), ...content.flatMap((c) => c.tasks)]
    store.assets = [...store.assets.filter((a) => !ids.has(a.deliverable_id)), ...content.flatMap((c) => c.assets)]
    if (!ids.has(store.activeDeliverableId)) store.activeDeliverableId = deliverables[0]?.id ?? null
  },

  async loadComments(taskId) {
    try {
      const { comments } = await api.get(`/tasks/${taskId}/comments`)
      comments.forEach((c) => store.registerUsers([c.author]))
      store.comments = [...store.comments.filter((c) => c.task_id !== taskId), ...comments]
    } catch (err) {
      store.error = err.message
    }
  },

  // refresh one project card (progress counts, health...) after a task change
  async refreshProject(projectId) {
    try {
      const { project } = await api.get(`/projects/${projectId}`)
      const index = store.projects.findIndex((p) => p.id === projectId)
      if (index !== -1) store.projects[index] = project
    } catch {
      // the counters will catch up on the next load
    }
  },

  registerUsers(list) {
    for (const user of list ?? []) {
      if (user && !store.users.some((u) => u.id === user.id)) store.users.push({ ...user })
    }
  },

  setActiveProject(projectId) {
    if (store.activeProjectId === projectId) return
    store.activeProjectId = projectId
    store.activeDeliverableId = store.deliverables.find((d) => d.project_id === projectId)?.id ?? null
    try {
      localStorage.setItem(ACTIVE_PROJECT_KEY, String(projectId))
    } catch {
      // not critical
    }
    store.loadProject(projectId).catch((err) => (store.error = err.message))
  setActiveProject(projectId) {
    store.activeProjectId = projectId
    store.activeDeliverableId = store.deliverables.find((d) => d.project_id === projectId)?.id ?? null
  },

  setActiveDeliverable(deliverableId) {
    store.activeDeliverableId = deliverableId
  },

  // ---------- writes ----------

  // Runs an API write; on failure stores the message in `error` and returns { ok: false, error }.
  async write(action) {
    store.error = ''
    try {
      return { ok: true, value: await action() }
    } catch (err) {
      const details = err.details ? Object.values(err.details).join(' ') : ''
      store.error = details || err.message
      return { ok: false, error: store.error }
    }
  },

  async createProject(name, description) {
    return store.write(async () => {
      const { project } = await api.post('/projects', { name, ...(description ? { description } : {}) })
      store.registerUsers(project.members)
      store.projects.unshift(project)
      store.setActiveProject(project.id)
      return project
    })
  },

  // creates a deliverable in a project (a board belongs to a deliverable, so a project needs at least one)
  async addDeliverable(projectId, title, { platform = 'youtube', publish_date } = {}) {
    return store.write(async () => {
      const { deliverable } = await api.post(`/projects/${projectId}/deliverables`, {
        title,
        platform,
        ...(publish_date ? { publish_date } : {}),
      })
      store.deliverables.push(deliverable)
      store.activeDeliverableId = deliverable.id
      store.refreshProject(projectId)
      return deliverable
    })
  },

  // adds a task at the bottom of a kanban column (status = 'todo' | 'doing' | 'done')
  async addTask(deliverableId, title, status = 'todo') {
    return store.write(async () => {
      const { task } = await api.post(`/deliverables/${deliverableId}/tasks`, { title, status })
      store.tasks.push(task)
      store.refreshProject(store.deliverables.find((d) => d.id === deliverableId)?.project_id)
      return task
    })
  },

  async deleteTask(taskId) {
    return store.write(async () => {
      const deliverableId = store.taskById(taskId)?.deliverable_id
      await api.delete(`/tasks/${taskId}`)
      store.tasks = store.tasks.filter((t) => t.id !== taskId)
      store.comments = store.comments.filter((c) => c.task_id !== taskId)
      store.refreshProject(store.deliverables.find((d) => d.id === deliverableId)?.project_id)
    })
  },

  // puts one more person on a task / takes one off (the API answers with the updated task)
  async assignMember(taskId, userId) {
    return store.write(async () => {
      const { task } = await api.put(`/tasks/${taskId}/assignees/${userId}`)
      store.replaceTask(task)
    })
  },

  async unassignMember(taskId, userId) {
    return store.write(async () => {
      const { task } = await api.delete(`/tasks/${taskId}/assignees/${userId}`)
      store.replaceTask(task)
    })
  },

  async updateTaskStage(taskId, stage) {
    return store.write(async () => {
      const { task } = await api.patch(`/tasks/${taskId}`, { stage })
      store.replaceTask(task)
    })
  },

  // moves the task to another kanban column; the API answers with the renumbered board
  async updateTaskStatus(taskId, status, position) {
    return store.write(async () => {
      const { tasks } = await api.patch(`/tasks/${taskId}/move`, position === undefined ? { status } : { status, position })
      const deliverableId = tasks[0]?.deliverable_id
      store.tasks = [...store.tasks.filter((t) => t.deliverable_id !== deliverableId), ...tasks]
      store.refreshProject(store.deliverables.find((d) => d.id === deliverableId)?.project_id)
    })
  },

  replaceTask(task) {
    const index = store.tasks.findIndex((t) => t.id === task.id)
    if (index === -1) store.tasks.push(task)
    else store.tasks[index] = task
  },

  async addComment(taskId, body) {
    return store.write(async () => {
      const { comment } = await api.post(`/tasks/${taskId}/comments`, { body })
      store.registerUsers([comment.author])
      store.comments.push(comment)
      const task = store.taskById(taskId)
      if (task) task.comment_count = (task.comment_count ?? 0) + 1
    })
  },

  async inviteMember(projectId, email, role) {
    const result = await store.write(async () => {
      const { member } = await api.post(`/projects/${projectId}/members`, { email, role })
      store.registerUsers([member])
      store.projects.find((p) => p.id === projectId)?.members.push(member)
    })
    return result.ok ? result : { ok: false, error: result.error }
  },

  async updateMemberRole(projectId, userId, role) {
    return store.write(async () => {
      const { member } = await api.patch(`/projects/${projectId}/members/${userId}`, { role })
      const target = store.membersOf(projectId).find((m) => m.id === userId)
      if (target) target.role = member.role
      // my own role may have changed (owner -> editor): refresh what I'm allowed to do
      await store.refreshProject(projectId)
    })
  },

  // permanently deletes a project (owner only). The API wants it archived first, so we archive then delete.
  async deleteProject(projectId) {
    return store.write(async () => {
      const project = store.projects.find((p) => p.id === projectId)
      if (project && !project.archived_at) await api.post(`/projects/${projectId}/archive`)
      await api.delete(`/projects/${projectId}`)
      store.forgetProject(projectId)
    })
  },

  // drops a project and everything loaded for it, and picks another active project if needed
  forgetProject(projectId) {
    store.projects = store.projects.filter((p) => p.id !== projectId)
    const gone = new Set(store.deliverables.filter((d) => d.project_id === projectId).map((d) => d.id))
    store.deliverables = store.deliverables.filter((d) => d.project_id !== projectId)
    store.tasks = store.tasks.filter((t) => !gone.has(t.deliverable_id))
    store.assets = store.assets.filter((a) => !gone.has(a.deliverable_id))
    if (store.activeProjectId === projectId) {
      store.activeProjectId = null
      store.activeDeliverableId = null
      const next = store.activeProjects[0]
      if (next) store.setActiveProject(next.id)
    }
  },

  async removeMember(projectId, userId, currentUserId) {
    return store.write(async () => {
      await api.delete(`/projects/${projectId}/members/${userId}`)
      if (userId === currentUserId) {
        // I left the project: it's gone from my list
        store.forgetProject(projectId)
        return
      }
      const project = store.projects.find((p) => p.id === projectId)
      if (project) project.members = project.members.filter((m) => m.id !== userId)
      const projectDeliverables = new Set(store.deliverablesOf(projectId).map((d) => d.id))
      for (const task of store.tasks) {
        if (projectDeliverables.has(task.deliverable_id) && task.assignee_ids?.includes(userId)) {
          task.assignee_ids = task.assignee_ids.filter((id) => id !== userId)
        }
      }
    })
  },
})

let loadedOnce = null

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
