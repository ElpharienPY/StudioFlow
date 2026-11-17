import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { pool } from './db/pool.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requireAuth } from './middleware/auth.js'

import { authRouter } from './modules/auth/auth.routes.js'
import { membersRouter } from './modules/auth/members.routes.js'
import { projectsRouter } from './modules/deliverables/projects.routes.js'
import { deliverablesRouter } from './modules/deliverables/deliverables.routes.js'
import { assetsRouter } from './modules/deliverables/assets.routes.js'
import { tasksRouter } from './modules/boards/tasks.routes.js'
import { commentsRouter } from './modules/boards/comments.routes.js'

export const app = express()

app.disable('x-powered-by')
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())

app.get('/health', (req, res) => res.json({ ok: true }))
app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, db: true })
  } catch {
    res.status(503).json({ ok: false, db: false })
  }
})

// /auth/* handles its own auth (login, signup... are public); everything below needs a valid access token.
// Scoped to these prefixes so unknown URLs still get a clean 404.
app.use('/auth', authRouter)
app.use(['/projects', '/deliverables', '/tasks', '/comments', '/assets'], requireAuth)

// Auth & Team
app.use(membersRouter)
// Projects & Deliverables
app.use(projectsRouter)
app.use(deliverablesRouter)
app.use(assetsRouter)
// Boards & Tasks
app.use(tasksRouter)
app.use(commentsRouter)

app.use(notFoundHandler)
app.use(errorHandler)
