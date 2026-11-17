import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { access } from '../../middleware/access.js'
import { forbidden } from '../../utils/httpError.js'
import { idParam, parseBody, rules } from '../../utils/validate.js'
import { publicUser } from '../../utils/serialize.js'

export const commentsRouter = Router()

const SELECT_COMMENT = `
  SELECT c.id, c.task_id, c.author_id, c.body, c.created_at, u.full_name, u.email
    FROM comments c JOIN users u ON u.id = c.author_id`

const commentOut = (row) => ({
  id: row.id,
  task_id: row.task_id,
  author_id: row.author_id,
  body: row.body,
  created_at: row.created_at,
  author: publicUser({ id: row.author_id, full_name: row.full_name, email: row.email }),
})

// GET /tasks/:taskId/comments   (oldest first, like a conversation)
commentsRouter.get('/tasks/:taskId/comments', async (req, res) => {
  const taskId = idParam(req.params.taskId)
  await access.task(req.user, taskId)
  const [rows] = await pool.execute(`${SELECT_COMMENT} WHERE c.task_id = ? ORDER BY c.created_at, c.id`, [taskId])
  res.json({ comments: rows.map(commentOut) })
})

// POST /tasks/:taskId/comments  { body }
// every member can comment, viewers included (a client reviewing a cut is typically a viewer)
commentsRouter.post('/tasks/:taskId/comments', async (req, res) => {
  const taskId = idParam(req.params.taskId)
  await access.task(req.user, taskId, { write: true })
  const { body } = parseBody(req.body, { body: rules.string({ max: 5000 }) })
  const [result] = await pool.execute('INSERT INTO comments (task_id, author_id, body) VALUES (?, ?, ?)', [taskId, req.user.id, body])
  const [rows] = await pool.execute(`${SELECT_COMMENT} WHERE c.id = ?`, [result.insertId])
  res.status(201).json({ comment: commentOut(rows[0]) })
})

// DELETE /comments/:id   (the author, or a project owner for moderation)
commentsRouter.delete('/comments/:id', async (req, res) => {
  const id = idParam(req.params.id)
  const comment = await access.comment(req.user, id, { write: true })
  if (comment.author_id !== req.user.id && comment.role !== 'owner') {
    throw forbidden('You can only delete your own comments.')
  }
  await pool.execute('DELETE FROM comments WHERE id = ?', [id])
  res.status(204).end()
})
