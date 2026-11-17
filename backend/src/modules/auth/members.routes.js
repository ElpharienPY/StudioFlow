import { Router } from 'express'
import { pool, withTransaction } from '../../db/pool.js'
import { access } from '../../middleware/access.js'
import { ROLES } from '../../utils/constants.js'
import { conflict, forbidden, notFound } from '../../utils/httpError.js'
import { idParam, optional, parseBody, rules } from '../../utils/validate.js'
import { publicUser } from '../../utils/serialize.js'

// Team vertical: who is in a project and with which role.
export const membersRouter = Router()

const memberOut = (row) => ({ ...publicUser(row), role: row.role, joined_at: row.joined_at })

async function listMembers(projectId, conn = pool) {
  const [rows] = await conn.execute(
    `SELECT u.id, u.full_name, u.email, pm.role, pm.joined_at
       FROM project_members pm JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = ?
      ORDER BY FIELD(pm.role, 'owner', 'editor', 'viewer'), u.full_name`,
    [projectId]
  )
  return rows.map(memberOut)
}

// GET /projects/:projectId/members
membersRouter.get('/projects/:projectId/members', async (req, res) => {
  const projectId = idParam(req.params.projectId)
  await access.project(req.user, projectId)
  res.json({ members: await listMembers(projectId) })
})

// POST /projects/:projectId/members  { email, role? }   (owner only)
membersRouter.post('/projects/:projectId/members', async (req, res) => {
  const projectId = idParam(req.params.projectId)
  await access.project(req.user, projectId, { min: 'owner', write: true })
  const body = parseBody(req.body, { email: rules.email(), role: optional(rules.oneOf(ROLES)) })

  const [users] = await pool.execute('SELECT id, full_name, email FROM users WHERE email = ?', [body.email])
  const user = users[0]
  if (!user) throw notFound('No account with this email yet — they need to sign up first.', { code: 'user_not_found' })

  try {
    await pool.execute('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [
      projectId, user.id, body.role ?? 'editor',
    ])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw conflict(`${user.full_name} is already a member of this project.`, { code: 'already_member' })
    throw err
  }
  const member = (await listMembers(projectId)).find((m) => m.id === user.id)
  res.status(201).json({ member })
})

// Shared by role change / removal: a project must always keep at least one owner.
// FOR UPDATE locks the owner rows so two concurrent requests can't both remove "the other" owner.
async function guardLastOwner(conn, projectId, targetUserId) {
  const [owners] = await conn.execute(
    "SELECT user_id FROM project_members WHERE project_id = ? AND role = 'owner' FOR UPDATE",
    [projectId]
  )
  const targetIsOwner = owners.some((o) => o.user_id === targetUserId)
  if (targetIsOwner && owners.length <= 1) {
    const [[{ total }]] = await conn.execute('SELECT COUNT(*) AS total FROM project_members WHERE project_id = ?', [projectId])
    throw conflict(
      total <= 1
        ? 'You are the only member of this project, so you cannot leave it. Archive it instead.'
        : 'A project needs at least one owner. Make someone else an owner first.',
      { code: 'last_owner' }
    )
  }
}

// PATCH /projects/:projectId/members/:userId  { role }   (owner only)
membersRouter.patch('/projects/:projectId/members/:userId', async (req, res) => {
  const projectId = idParam(req.params.projectId)
  const userId = idParam(req.params.userId)
  await access.project(req.user, projectId, { min: 'owner', write: true })
  const { role } = parseBody(req.body, { role: rules.oneOf(ROLES) })

  await withTransaction(async (conn) => {
    const [rows] = await conn.execute('SELECT role FROM project_members WHERE project_id = ? AND user_id = ? FOR UPDATE', [projectId, userId])
    if (!rows[0]) throw notFound('This user is not a member of the project.')
    if (rows[0].role === 'owner' && role !== 'owner') await guardLastOwner(conn, projectId, userId)
    await conn.execute('UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?', [role, projectId, userId])
  })
  const member = (await listMembers(projectId)).find((m) => m.id === userId)
  res.json({ member })
})

// DELETE /projects/:projectId/members/:userId   (owner removes anyone; anyone can remove themselves = leave)
membersRouter.delete('/projects/:projectId/members/:userId', async (req, res) => {
  const projectId = idParam(req.params.projectId)
  const userId = idParam(req.params.userId)
  const { role } = await access.project(req.user, projectId, { write: true })
  if (userId !== req.user.id && role !== 'owner') throw forbidden('Only project owners can remove other members.')

  await withTransaction(async (conn) => {
    const [rows] = await conn.execute('SELECT role FROM project_members WHERE project_id = ? AND user_id = ? FOR UPDATE', [projectId, userId])
    if (!rows[0]) throw notFound('This user is not a member of the project.')
    await guardLastOwner(conn, projectId, userId)
    // whoever leaves (or is removed) stops being assigned to this project's tasks
    await conn.execute(
      `DELETE ta FROM task_assignees ta
         JOIN tasks t ON t.id = ta.task_id
         JOIN deliverables d ON d.id = t.deliverable_id
        WHERE d.project_id = ? AND ta.user_id = ?`,
      [projectId, userId]
    )
    await conn.execute('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId])
  })
  res.status(204).end()
})
