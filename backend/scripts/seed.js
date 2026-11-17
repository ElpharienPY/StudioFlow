// Fills the DB with demo data = the same mock data the front-end used (frontend/src/data/fixtures.js),
// so the app looks identical once it talks to the API.  (npm run db:seed)
// WARNING: empties every table first. Dev only.
import bcrypt from 'bcrypt'
import { env } from '../src/config/env.js'
import { pool } from '../src/db/pool.js'

if (env.isProd) {
  console.error('Refusing to seed with NODE_ENV=production.')
  process.exit(1)
}

const DEMO_PASSWORD = 'password123'
const fx = await import('../../frontend/src/data/fixtures.js')
const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
const date = (iso) => (iso ? new Date(iso) : null)

const conn = await pool.getConnection()
try {
  await conn.query('SET FOREIGN_KEY_CHECKS = 0')
  for (const table of ['assets', 'comments', 'task_assignees', 'tasks', 'deliverables', 'project_members', 'projects', 'refresh_tokens', 'accounts', 'users']) {
    await conn.query(`TRUNCATE TABLE \`${table}\``)
  }
  await conn.query('SET FOREIGN_KEY_CHECKS = 1')

  await conn.query('INSERT INTO users (id, full_name, email, password_hash) VALUES ?', [
    fx.users.map((u) => [u.id, u.full_name, u.email, passwordHash]),
  ])
  await conn.query('INSERT INTO projects (id, name, description, health_status, archived_at) VALUES ?', [
    fx.projects.map((p) => [p.id, p.name, p.description, p.health_status, date(p.archived_at)]),
  ])
  await conn.query('INSERT INTO project_members (project_id, user_id, role) VALUES ?', [
    fx.projectMembers.map((m) => [m.project_id, m.user_id, m.role]),
  ])
  await conn.query('INSERT INTO deliverables (id, project_id, title, platform, publish_date, revision_round) VALUES ?', [
    fx.deliverables.map((d) => [d.id, d.project_id, d.title, d.platform, d.publish_date, d.revision_round]),
  ])
  await conn.query(
    'INSERT INTO tasks (id, deliverable_id, title, description, status, stage, due_date, position) VALUES ?',
    [fx.tasks.map((t) => [t.id, t.deliverable_id, t.title, t.description, t.status, t.stage, t.due_date, t.position])]
  )
  // the mocks have one assignee per task (assignee_id); task 101 gets a second person so the demo shows several
  const assignees = fx.tasks.filter((t) => t.assignee_id).map((t) => [t.id, t.assignee_id])
  assignees.push([101, 1])
  await conn.query('INSERT INTO task_assignees (task_id, user_id) VALUES ?', [assignees])
  await conn.query('INSERT INTO comments (id, task_id, author_id, body, created_at) VALUES ?', [
    fx.comments.map((c) => [c.id, c.task_id, c.author_id, c.body, date(c.created_at)]),
  ])
  await conn.query('INSERT INTO assets (id, deliverable_id, uploaded_by, label, url, kind, version, created_at) VALUES ?', [
    // the mocks used '#' as a url; the API only accepts http(s) links
    fx.assets.map((a) => [a.id, a.deliverable_id, a.uploaded_by, a.label, a.url === '#' ? `https://example.com/assets/${a.id}` : a.url, a.kind, a.version, date(a.created_at)]),
  ])

  console.log(`Seeded: ${fx.users.length} users, ${fx.projects.length} projects, ${fx.deliverables.length} deliverables, ${fx.tasks.length} tasks.`)
  console.log(`Log in with  ${fx.users[0].email}  /  ${DEMO_PASSWORD}   (all demo users share that password)`)
} catch (err) {
  console.error(`db:seed failed: ${err.code ?? ''} ${err.message}`)
  process.exitCode = 1
} finally {
  conn.release()
  await pool.end()
}
