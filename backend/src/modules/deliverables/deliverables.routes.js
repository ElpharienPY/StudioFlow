import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { access } from '../../middleware/access.js'
import { PLATFORMS, SQL_STAGE_FIELD, STAGES } from '../../utils/constants.js'
import { notFound } from '../../utils/httpError.js'
import { idParam, nullable, optional, parseBody, rules } from '../../utils/validate.js'

export const deliverablesRouter = Router()

// A deliverable's current stage isn't stored (see db/schema.sql): it's the furthest production
// stage among its tasks, or "concept" when it has none yet.
const SELECT_DELIVERABLE = `
  SELECT d.*,
         (SELECT COUNT(*) FROM tasks t WHERE t.deliverable_id = d.id) AS task_total,
         (SELECT COUNT(*) FROM tasks t WHERE t.deliverable_id = d.id AND t.status = 'done') AS task_done,
         (SELECT MAX(FIELD(t.stage, ${SQL_STAGE_FIELD})) FROM tasks t WHERE t.deliverable_id = d.id) AS stage_index
    FROM deliverables d`

const deliverableOut = (row) => ({
  id: row.id,
  project_id: row.project_id,
  title: row.title,
  platform: row.platform,
  publish_date: row.publish_date,
  revision_round: row.revision_round,
  created_at: row.created_at,
  updated_at: row.updated_at,
  stage: row.stage_index > 0 ? STAGES[row.stage_index - 1] : STAGES[0],
  progress: { done: row.task_done, total: row.task_total },
})

async function fetchDeliverable(id) {
  const [rows] = await pool.execute(`${SELECT_DELIVERABLE} WHERE d.id = ?`, [id])
  if (!rows[0]) throw notFound()
  return deliverableOut(rows[0])
}

// GET /projects/:projectId/deliverables
deliverablesRouter.get('/projects/:projectId/deliverables', async (req, res) => {
  const projectId = idParam(req.params.projectId)
  await access.project(req.user, projectId)
  const [rows] = await pool.execute(
    `${SELECT_DELIVERABLE} WHERE d.project_id = ? ORDER BY d.publish_date IS NULL, d.publish_date, d.id`,
    [projectId]
  )
  res.json({ deliverables: rows.map(deliverableOut) })
})

// POST /projects/:projectId/deliverables  { title, platform?, publish_date? }   (editor+)
deliverablesRouter.post('/projects/:projectId/deliverables', async (req, res) => {
  const projectId = idParam(req.params.projectId)
  await access.project(req.user, projectId, { min: 'editor', write: true })
  const body = parseBody(req.body, {
    title: rules.string({ max: 150 }),
    platform: optional(rules.oneOf(PLATFORMS)),
    publish_date: optional(nullable(rules.date())),
  })
  const [result] = await pool.execute('INSERT INTO deliverables (project_id, title, platform, publish_date) VALUES (?, ?, ?, ?)', [
    projectId, body.title, body.platform ?? 'youtube', body.publish_date ?? null,
  ])
  res.status(201).json({ deliverable: await fetchDeliverable(result.insertId) })
})

// GET /deliverables/:id
deliverablesRouter.get('/deliverables/:id', async (req, res) => {
  const id = idParam(req.params.id)
  await access.deliverable(req.user, id)
  res.json({ deliverable: await fetchDeliverable(id) })
})

// PATCH /deliverables/:id  { title?, platform?, publish_date?, revision_round? }   (editor+)
deliverablesRouter.patch('/deliverables/:id', async (req, res) => {
  const id = idParam(req.params.id)
  await access.deliverable(req.user, id, { min: 'editor', write: true })
  const changes = parseBody(
    req.body,
    {
      title: rules.string({ max: 150 }),
      platform: rules.oneOf(PLATFORMS),
      publish_date: nullable(rules.date()),
      revision_round: rules.int({ min: 0, max: 1000 }),
    },
    { partial: true }
  )
  await pool.execute(`UPDATE deliverables SET ${Object.keys(changes).map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, [
    ...Object.values(changes), id,
  ])
  res.json({ deliverable: await fetchDeliverable(id) })
})

// POST /deliverables/:id/revisions -> starts a new revision round (revision_round + 1)   (editor+)
deliverablesRouter.post('/deliverables/:id/revisions', async (req, res) => {
  const id = idParam(req.params.id)
  await access.deliverable(req.user, id, { min: 'editor', write: true })
  await pool.execute('UPDATE deliverables SET revision_round = revision_round + 1 WHERE id = ?', [id])
  res.json({ deliverable: await fetchDeliverable(id) })
})

// DELETE /deliverables/:id   (editor+) — tasks, comments and assets go with it
deliverablesRouter.delete('/deliverables/:id', async (req, res) => {
  const id = idParam(req.params.id)
  await access.deliverable(req.user, id, { min: 'editor', write: true })
  await pool.execute('DELETE FROM deliverables WHERE id = ?', [id])
  res.status(204).end()
})
