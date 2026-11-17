import { Router } from 'express'
import { pool, withTransaction } from '../../db/pool.js'
import { access } from '../../middleware/access.js'
import { HEALTH_STATUSES } from '../../utils/constants.js'
import { conflict, notFound } from '../../utils/httpError.js'
import { idParam, optional, parseBody, rules } from '../../utils/validate.js'
import { publicUser } from '../../utils/serialize.js'

export const projectsRouter = Router()

const projectOut = (row, members = []) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  health_status: row.health_status,
  archived_at: row.archived_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
  role: row.role, // the current user's role in this project
  deliverable_count: row.deliverable_count,
  progress: { done: row.task_done, total: row.task_total }, // tasks done / total across the project
  members,
})

// Projects the user belongs to, with progress and member avatars (what the dashboard cards show).
async function fetchProjects(userId, { archived = 'all', projectId = null } = {}) {
  const where = ['1 = 1']
  const params = [userId]
  if (archived === 'true') where.push('p.archived_at IS NOT NULL')
  if (archived === 'false') where.push('p.archived_at IS NULL')
  if (projectId) {
    where.push('p.id = ?')
    params.push(projectId)
  }
  const [rows] = await pool.execute(
    `SELECT p.*, pm.role,
            (SELECT COUNT(*) FROM deliverables d WHERE d.project_id = p.id) AS deliverable_count,
            (SELECT COUNT(*) FROM tasks t JOIN deliverables d ON d.id = t.deliverable_id
              WHERE d.project_id = p.id) AS task_total,
            (SELECT COUNT(*) FROM tasks t JOIN deliverables d ON d.id = t.deliverable_id
              WHERE d.project_id = p.id AND t.status = 'done') AS task_done
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
      WHERE ${where.join(' AND ')}
      ORDER BY p.archived_at IS NOT NULL, p.updated_at DESC, p.id DESC`,
    params
  )
  if (rows.length === 0) return []

  const [memberRows] = await pool.query(
    `SELECT pm.project_id, pm.role, u.id, u.full_name, u.email
       FROM project_members pm JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id IN (?)
      ORDER BY FIELD(pm.role, 'owner', 'editor', 'viewer'), u.full_name`,
    [rows.map((r) => r.id)]
  )
  const byProject = new Map()
  for (const m of memberRows) {
    if (!byProject.has(m.project_id)) byProject.set(m.project_id, [])
    byProject.get(m.project_id).push({ ...publicUser(m), role: m.role })
  }
  return rows.map((r) => projectOut(r, byProject.get(r.id) ?? []))
}

// GET /projects?archived=true|false|all   (default: all)
projectsRouter.get('/projects', async (req, res) => {
  const { archived } = parseBody({ archived: req.query.archived ?? 'all' }, { archived: rules.oneOf(['true', 'false', 'all']) })
  res.json({ projects: await fetchProjects(req.user.id, { archived }) })
})

// POST /projects  { name, description?, health_status? }  -> the creator becomes owner
projectsRouter.post('/projects', async (req, res) => {
  const body = parseBody(req.body, {
    name: rules.string({ max: 150 }),
    description: optional(rules.text()),
    health_status: optional(rules.oneOf(HEALTH_STATUSES)),
  })
  const projectId = await withTransaction(async (conn) => {
    const [result] = await conn.execute('INSERT INTO projects (name, description, health_status) VALUES (?, ?, ?)', [
      body.name, body.description ?? null, body.health_status ?? 'kickoff',
    ])
    await conn.execute("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'owner')", [result.insertId, req.user.id])
    return result.insertId
  })
  const [project] = await fetchProjects(req.user.id, { projectId })
  res.status(201).json({ project })
})

// GET /projects/:id
projectsRouter.get('/projects/:id', async (req, res) => {
  const id = idParam(req.params.id)
  await access.project(req.user, id)
  const [project] = await fetchProjects(req.user.id, { projectId: id })
  res.json({ project })
})

// PATCH /projects/:id  { name?, description?, health_status? }   (owner only — health is set manually)
projectsRouter.patch('/projects/:id', async (req, res) => {
  const id = idParam(req.params.id)
  await access.project(req.user, id, { min: 'owner', write: true })
  const changes = parseBody(
    req.body,
    { name: rules.string({ max: 150 }), description: rules.text(), health_status: rules.oneOf(HEALTH_STATUSES) },
    { partial: true }
  )
  const columns = Object.keys(changes)
  await pool.execute(`UPDATE projects SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, [...Object.values(changes), id])
  const [project] = await fetchProjects(req.user.id, { projectId: id })
  res.json({ project })
})

// POST /projects/:id/archive | /unarchive   (owner only) — archiving is our soft delete, projects become read-only
for (const action of ['archive', 'unarchive']) {
  projectsRouter.post(`/projects/:id/${action}`, async (req, res) => {
    const id = idParam(req.params.id)
    await access.project(req.user, id, { min: 'owner' })
    await pool.execute(
      action === 'archive'
        ? 'UPDATE projects SET archived_at = COALESCE(archived_at, NOW()) WHERE id = ?'
        : 'UPDATE projects SET archived_at = NULL WHERE id = ?',
      [id]
    )
    const [project] = await fetchProjects(req.user.id, { projectId: id })
    res.json({ project })
  })
}

// DELETE /projects/:id   (owner only, and only once archived) — permanent, cascades to everything inside
projectsRouter.delete('/projects/:id', async (req, res) => {
  const id = idParam(req.params.id)
  const project = await access.project(req.user, id, { min: 'owner' })
  if (!project.archived_at) throw conflict('Archive the project before deleting it permanently.', { code: 'not_archived' })
  const [result] = await pool.execute('DELETE FROM projects WHERE id = ?', [id])
  if (result.affectedRows === 0) throw notFound()
  res.status(204).end()
})

