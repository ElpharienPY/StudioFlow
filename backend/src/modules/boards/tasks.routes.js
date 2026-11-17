import { Router } from 'express'
import { pool, withTransaction } from '../../db/pool.js'
import { access } from '../../middleware/access.js'
import { SQL_STATUS_FIELD, STAGES, TASK_STATUSES } from '../../utils/constants.js'
import { HttpError, notFound } from '../../utils/httpError.js'
import { idParam, nullable, optional, parseBody, rules } from '../../utils/validate.js'

export const tasksRouter = Router()

// status = kanban column (todo/doing/done); stage = production step (concept...publishing).
// They are independent: a task in the "doing" column can be at the "editing" stage.
const SELECT_TASK = `
  SELECT t.*, (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) AS comment_count
    FROM tasks t`
const ORDER_BOARD = `ORDER BY FIELD(t.status, ${SQL_STATUS_FIELD}), t.position, t.id`

const taskOut = (row, assigneeIds = []) => ({
  id: row.id,
  deliverable_id: row.deliverable_id,
  assignee_ids: assigneeIds, // everybody working on the task (zero, one or several project members)
  title: row.title,
  description: row.description,
  status: row.status,
  stage: row.stage,
  due_date: row.due_date,
  position: row.position,
  comment_count: row.comment_count,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

// adds `assignee_ids` to a list of task rows with one extra query
async function withAssignees(rows, conn = pool) {
  if (rows.length === 0) return []
  const [links] = await conn.query(
    'SELECT task_id, user_id FROM task_assignees WHERE task_id IN (?) ORDER BY assigned_at, user_id',
    [rows.map((r) => r.id)]
  )
  const byTask = new Map()
  for (const { task_id, user_id } of links) {
    if (!byTask.has(task_id)) byTask.set(task_id, [])
    byTask.get(task_id).push(user_id)
  }
  return rows.map((r) => taskOut(r, byTask.get(r.id) ?? []))
}

async function fetchTask(id, conn = pool) {
  const [rows] = await conn.execute(`${SELECT_TASK} WHERE t.id = ?`, [id])
  if (!rows[0]) throw notFound()
  return (await withAssignees(rows, conn))[0]
}

async function fetchBoard(deliverableId, conn = pool) {
  const [rows] = await conn.execute(`${SELECT_TASK} WHERE t.deliverable_id = ? ${ORDER_BOARD}`, [deliverableId])
  return withAssignees(rows, conn)
}

// every assignee must belong to the task's project
async function assertAssignees(projectId, userIds, field = 'assignee_ids', conn = pool) {
  if (!userIds || userIds.length === 0) return
  const [rows] = await conn.query('SELECT user_id FROM project_members WHERE project_id = ? AND user_id IN (?)', [projectId, userIds])
  if (rows.length !== userIds.length) {
    throw new HttpError(400, 'Validation failed.', {
      code: 'validation_error',
      details: { [field]: 'every assignee must be a member of this project' },
    })
  }
}

// makes the assignee list of a task exactly `userIds` (adds the new ones, removes the others)
async function setAssignees(conn, taskId, userIds) {
  if (userIds.length === 0) {
    await conn.execute('DELETE FROM task_assignees WHERE task_id = ?', [taskId])
    return
  }
  await conn.query('DELETE FROM task_assignees WHERE task_id = ? AND user_id NOT IN (?)', [taskId, userIds])
  await conn.query('INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES ?', [userIds.map((u) => [taskId, u])])
}

// GET /deliverables/:id/tasks?status=todo|doing|done&assignee=me   -> the kanban board, in column order
tasksRouter.get('/deliverables/:id/tasks', async (req, res) => {
  const id = idParam(req.params.id)
  await access.deliverable(req.user, id)
  const filters = parseBody(
    { status: req.query.status ?? 'all', assignee: req.query.assignee ?? 'all' },
    { status: rules.oneOf(['all', ...TASK_STATUSES]), assignee: rules.oneOf(['all', 'me']) }
  )
  const tasks = (await fetchBoard(id)).filter(
    (t) => (filters.status === 'all' || t.status === filters.status) && (filters.assignee === 'all' || t.assignee_ids.includes(req.user.id))
  )
  res.json({ tasks })
})

// POST /deliverables/:id/tasks  { title, description?, status?, stage?, assignee_ids?, due_date? }   (editor+)
// the new task goes to the bottom of its column (status = todo / doing / done)
tasksRouter.post('/deliverables/:id/tasks', async (req, res) => {
  const id = idParam(req.params.id)
  const deliverable = await access.deliverable(req.user, id, { min: 'editor', write: true })
  const body = parseBody(req.body, {
    title: rules.string({ max: 150 }),
    description: optional(rules.text()),
    status: optional(rules.oneOf(TASK_STATUSES)),
    stage: optional(nullable(rules.oneOf(STAGES))),
    assignee_ids: optional(rules.intArray()),
    due_date: optional(nullable(rules.date())),
  })
  await assertAssignees(deliverable.project_id, body.assignee_ids)

  const status = body.status ?? 'todo'
  const task = await withTransaction(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO tasks (deliverable_id, title, description, status, stage, due_date, position)
       SELECT ?, ?, ?, ?, ?, ?, COALESCE(MAX(position) + 1, 0)
         FROM tasks WHERE deliverable_id = ? AND status = ?`,
      [id, body.title, body.description ?? null, status, body.stage ?? null, body.due_date ?? null, id, status]
    )
    if (body.assignee_ids?.length) await setAssignees(conn, result.insertId, body.assignee_ids)
    return fetchTask(result.insertId, conn)
  })
  res.status(201).json({ task })
})

// GET /tasks/:id
tasksRouter.get('/tasks/:id', async (req, res) => {
  const id = idParam(req.params.id)
  await access.task(req.user, id)
  res.json({ task: await fetchTask(id) })
})

// PATCH /tasks/:id  { title?, description?, stage?, assignee_ids?, due_date? }   (editor+)
// assignee_ids REPLACES the whole list of people working on the task ([] = nobody).
// (status/position change through /move so the columns stay consistent)
tasksRouter.patch('/tasks/:id', async (req, res) => {
  const id = idParam(req.params.id)
  const task = await access.task(req.user, id, { min: 'editor', write: true })
  const { assignee_ids, ...columns } = parseBody(
    req.body,
    {
      title: rules.string({ max: 150 }),
      description: rules.text(),
      stage: nullable(rules.oneOf(STAGES)),
      assignee_ids: rules.intArray(),
      due_date: nullable(rules.date()),
    },
    { partial: true }
  )
  await assertAssignees(task.project_id, assignee_ids)
  await withTransaction(async (conn) => {
    const keys = Object.keys(columns)
    if (keys.length) {
      await conn.execute(`UPDATE tasks SET ${keys.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, [...Object.values(columns), id])
    }
    if (assignee_ids) await setAssignees(conn, id, assignee_ids)
  })
  res.json({ task: await fetchTask(id) })
})

// PUT /tasks/:id/assignees/:userId   (editor+) — adds one person to the task (no-op if already there)
tasksRouter.put('/tasks/:id/assignees/:userId', async (req, res) => {
  const id = idParam(req.params.id)
  const userId = idParam(req.params.userId)
  const task = await access.task(req.user, id, { min: 'editor', write: true })
  await assertAssignees(task.project_id, [userId], 'user_id')
  await pool.execute('INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES (?, ?)', [id, userId])
  res.json({ task: await fetchTask(id) })
})

// DELETE /tasks/:id/assignees/:userId   (editor+) — takes one person off the task (no-op if not there)
// answers 200 with the updated task (not 204) so the front can just replace it
tasksRouter.delete('/tasks/:id/assignees/:userId', async (req, res) => {
  const id = idParam(req.params.id)
  const userId = idParam(req.params.userId)
  await access.task(req.user, id, { min: 'editor', write: true })
  await pool.execute('DELETE FROM task_assignees WHERE task_id = ? AND user_id = ?', [id, userId])
  res.json({ task: await fetchTask(id) })
})

// PATCH /tasks/:id/move  { status, position? }   (editor+)
// Drag & drop: puts the task in column `status` at index `position` (default: bottom) and
// renumbers positions 0..n-1 in every column of the board, atomically.
// Returns the whole updated board so the front can just replace its list.
tasksRouter.patch('/tasks/:id/move', async (req, res) => {
  const id = idParam(req.params.id)
  const task = await access.task(req.user, id, { min: 'editor', write: true })
  const { status, position } = parseBody(req.body, {
    status: rules.oneOf(TASK_STATUSES),
    position: optional(rules.int({ min: 0, max: 100000 })),
  })

  const tasks = await withTransaction(async (conn) => {
    // lock the board's rows so two simultaneous drags can't interleave
    const [rows] = await conn.execute(
      `SELECT id, status, position FROM tasks WHERE deliverable_id = ?
        ORDER BY FIELD(status, ${SQL_STATUS_FIELD}), position, id FOR UPDATE`,
      [task.deliverable_id]
    )
    const before = new Map(rows.map((r) => [r.id, r]))
    const columns = Object.fromEntries(TASK_STATUSES.map((s) => [s, []]))
    for (const r of rows) if (r.id !== id) columns[r.status].push(r.id)

    const target = columns[status]
    target.splice(position === undefined ? target.length : Math.min(position, target.length), 0, id)

    for (const column of TASK_STATUSES) {
      for (const [index, taskId] of columns[column].entries()) {
        const old = before.get(taskId)
        if (old.status !== column || old.position !== index) {
          await conn.execute('UPDATE tasks SET status = ?, position = ? WHERE id = ?', [column, index, taskId])
        }
      }
    }
    return fetchBoard(task.deliverable_id, conn)
  })
  res.json({ task: tasks.find((t) => t.id === id), tasks })
})

// DELETE /tasks/:id   (editor+) — its comments go with it
tasksRouter.delete('/tasks/:id', async (req, res) => {
  const id = idParam(req.params.id)
  await access.task(req.user, id, { min: 'editor', write: true })
  await pool.execute('DELETE FROM tasks WHERE id = ?', [id])
  res.status(204).end()
})
