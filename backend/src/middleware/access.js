// Per-project authorisation. Every resource (deliverable, task, comment, asset) belongs to a
// project, and what the user may do depends on their role there (owner > editor > viewer).
//
//   const { row } = await access.task(req.user, id, { min: 'editor', write: true })
//
//  - not a member of the project -> 404 (we don't reveal that the resource exists)
//  - role lower than `min`       -> 403
//  - write:true on an archived project -> 409 (archived projects are read-only)
import { pool } from '../db/pool.js'
import { ROLE_RANK } from '../utils/constants.js'
import { conflict, forbidden, notFound } from '../utils/httpError.js'

function check(row, { min = 'viewer', write = false } = {}) {
  if (!row || !row.role) throw notFound()
  if (ROLE_RANK[row.role] < ROLE_RANK[min]) throw forbidden(`This action requires the "${min}" role or higher.`)
  if (write && row.archived_at) throw conflict('This project is archived and read-only.', { code: 'project_archived' })
  return row
}

async function one(sql, params) {
  const [rows] = await pool.execute(sql, params)
  return rows[0]
}

const JOIN_MEMBER = 'LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?'

export const access = {
  project: async (user, projectId, opts) =>
    check(await one(`SELECT p.*, pm.role FROM projects p ${JOIN_MEMBER} WHERE p.id = ?`, [user.id, projectId]), opts),

  deliverable: async (user, id, opts) =>
    check(
      await one(
        `SELECT d.*, p.archived_at, pm.role FROM deliverables d
           JOIN projects p ON p.id = d.project_id ${JOIN_MEMBER} WHERE d.id = ?`,
        [user.id, id]
      ),
      opts
    ),

  task: async (user, id, opts) =>
    check(
      await one(
        `SELECT t.*, d.project_id, p.archived_at, pm.role FROM tasks t
           JOIN deliverables d ON d.id = t.deliverable_id
           JOIN projects p ON p.id = d.project_id ${JOIN_MEMBER} WHERE t.id = ?`,
        [user.id, id]
      ),
      opts
    ),

  comment: async (user, id, opts) =>
    check(
      await one(
        `SELECT c.*, d.project_id, p.archived_at, pm.role FROM comments c
           JOIN tasks t ON t.id = c.task_id
           JOIN deliverables d ON d.id = t.deliverable_id
           JOIN projects p ON p.id = d.project_id ${JOIN_MEMBER} WHERE c.id = ?`,
        [user.id, id]
      ),
      opts
    ),

  asset: async (user, id, opts) =>
    check(
      await one(
        `SELECT a.*, d.project_id, p.archived_at, pm.role FROM assets a
           JOIN deliverables d ON d.id = a.deliverable_id
           JOIN projects p ON p.id = d.project_id ${JOIN_MEMBER} WHERE a.id = ?`,
        [user.id, id]
      ),
      opts
    ),
}

// true if userId belongs to the project (used to validate task assignees)
export async function isMember(projectId, userId) {
  const row = await one('SELECT 1 AS ok FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId])
  return Boolean(row)
}
