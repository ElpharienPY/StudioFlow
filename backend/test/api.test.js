// Integration tests: real HTTP requests against the real app and a real MySQL database.
// They run on a separate database (DB_NAME + "_test", or TEST_DB_NAME), recreated from
// db/schema.sql at every run, so the demo data in DB_NAME is never touched.
//   npm test        (MySQL must be running)
import 'dotenv/config'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { test, after, before } from 'node:test'
import assert from 'node:assert/strict'

const testDb = process.env.TEST_DB_NAME ?? `${process.env.DB_NAME ?? 'studioflow'}_test`
if (testDb === process.env.DB_NAME) throw new Error('TEST_DB_NAME must differ from DB_NAME (the tests recreate it).')
process.env.DB_NAME = testDb // read by src/config/env.js below (dotenv never overrides it)
process.env.AUTH_RATE_LIMIT_MAX = '10000' // many signups in one run
process.env.GOOGLE_CLIENT_ID = '' // the tests never call Google: /auth/google must answer 501 even if .env sets it

// fresh schema in the test database (same script as `npm run db:init`)
const initDb = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/init-db.js', import.meta.url))], {
  env: process.env,
  encoding: 'utf8',
})
if (initDb.status !== 0) throw new Error(`Could not create the test database "${testDb}":\n${initDb.stderr || initDb.stdout}`)

const { app } = await import('../src/app.js')
const { pool } = await import('../src/db/pool.js')

let server
let base
before(async () => {
  server = app.listen(0)
  await new Promise((r) => server.once('listening', r))
  base = `http://127.0.0.1:${server.address().port}`
})
after(async () => {
  server.close()
  await pool.end()
})

// ---- tiny HTTP client that remembers the access token and the refresh cookie ----
async function call(session, method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  if (session?.token) headers.Authorization = `Bearer ${session.token}`
  if (session?.cookie) headers.Cookie = session.cookie
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const setCookie = res.headers.getSetCookie().find((c) => c.startsWith('refresh_token='))
  if (session && setCookie) session.cookie = setCookie.split(';')[0]
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null, setCookie }
}

const stamp = Date.now()
let counter = 0
async function newUser(label) {
  const session = { token: null, cookie: null }
  const email = `${label}.${stamp}.${counter++}@test.local`
  const res = await call(session, 'POST', '/auth/signup', { full_name: `Test ${label}`, email, password: 'password123' })
  assert.equal(res.status, 201, JSON.stringify(res.body))
  session.token = res.body.accessToken
  session.user = res.body.user
  session.email = email
  return session
}

// ------------------------------------------------------------------------------------------------

test('health, unknown route and bad JSON return our error format', async () => {
  assert.deepEqual((await call(null, 'GET', '/health')).body, { ok: true })
  assert.deepEqual((await call(null, 'GET', '/health/db')).body, { ok: true, db: true })
  const nf = await call(null, 'GET', '/nope')
  assert.equal(nf.status, 404)
  assert.equal(nf.body.error.code, 'not_found')
  const bad = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oops' })
  assert.equal(bad.status, 400)
  assert.equal((await bad.json()).error.code, 'bad_json')
})

test('auth: signup, login, me, validation, duplicate, wrong password', async () => {
  const email = `auth.${stamp}@test.local`
  const session = { token: null, cookie: null }

  const invalid = await call(session, 'POST', '/auth/signup', { full_name: '', email: 'nope', password: 'short' })
  assert.equal(invalid.status, 400)
  assert.deepEqual(Object.keys(invalid.body.error.details).sort(), ['email', 'full_name', 'password'])

  const ok = await call(session, 'POST', '/auth/signup', { full_name: 'Ada Lovelace', email: email.toUpperCase(), password: 'password123' })
  assert.equal(ok.status, 201)
  assert.equal(ok.body.user.email, email) // normalised to lowercase
  assert.equal(ok.body.user.initials, 'AL')
  assert.ok(!JSON.stringify(ok.body).includes('password'), 'password hash must never be returned')
  assert.match(ok.setCookie, /HttpOnly/i)
  assert.match(ok.setCookie, /Path=\/auth/i)

  assert.equal((await call(null, 'POST', '/auth/signup', { full_name: 'Dup', email, password: 'password123' })).status, 409)

  const bad1 = await call(null, 'POST', '/auth/login', { email, password: 'wrong-password' })
  const bad2 = await call(null, 'POST', '/auth/login', { email: `ghost.${stamp}@test.local`, password: 'whatever1' })
  assert.equal(bad1.status, 401)
  assert.deepEqual(bad1.body, bad2.body, 'unknown email and wrong password must look identical')

  const login = await call(session, 'POST', '/auth/login', { email, password: 'password123' })
  assert.equal(login.status, 200)
  session.token = login.body.accessToken
  const me = await call(session, 'GET', '/auth/me')
  assert.equal(me.body.user.full_name, 'Ada Lovelace')
})

test('auth: protected routes reject missing/garbage tokens', async () => {
  assert.equal((await call(null, 'GET', '/projects')).status, 401)
  const r = await call({ token: 'garbage' }, 'GET', '/projects')
  assert.equal(r.status, 401)
  assert.equal(r.body.error.code, 'invalid_token')
})

test('auth: refresh rotates the token; old one is rejected; logout revokes', async () => {
  const u = await newUser('refresh')
  const oldCookie = u.cookie

  const r1 = await call(u, 'POST', '/auth/refresh')
  assert.equal(r1.status, 200)
  assert.ok(r1.body.accessToken)
  assert.notEqual(u.cookie, oldCookie, 'refresh token must rotate')

  const replay = await call({ cookie: oldCookie }, 'POST', '/auth/refresh')
  assert.equal(replay.status, 401)
  assert.equal(replay.body.error.code, 'invalid_refresh')

  // right after rotation a replay is treated as a racing request, the new token still works
  assert.equal((await call(u, 'POST', '/auth/refresh')).status, 200)

  const savedCookie = u.cookie
  assert.equal((await call(u, 'POST', '/auth/logout')).status, 204)
  assert.equal((await call({ cookie: savedCookie }, 'POST', '/auth/refresh')).status, 401)
  assert.equal((await call(null, 'POST', '/auth/refresh')).status, 401)
})

test('google sign-in is a clean 501 when not configured', async () => {
  const r = await call(null, 'POST', '/auth/google', { credential: 'x' })
  assert.equal(r.status, 501)
})

test('projects: create, list, update, roles and permissions', async () => {
  const owner = await newUser('owner')
  const editor = await newUser('editor')
  const viewer = await newUser('viewer')
  const outsider = await newUser('outsider')

  const created = await call(owner, 'POST', '/projects', { name: '  My Project ', description: 'desc' })
  assert.equal(created.status, 201)
  const project = created.body.project
  assert.equal(project.name, 'My Project')
  assert.equal(project.health_status, 'kickoff')
  assert.equal(project.role, 'owner')
  assert.deepEqual(project.progress, { done: 0, total: 0 })
  assert.equal(project.members.length, 1)

  // invite
  assert.equal((await call(owner, 'POST', `/projects/${project.id}/members`, { email: editor.email, role: 'editor' })).status, 201)
  assert.equal((await call(owner, 'POST', `/projects/${project.id}/members`, { email: viewer.email, role: 'viewer' })).status, 201)
  assert.equal((await call(owner, 'POST', `/projects/${project.id}/members`, { email: editor.email })).status, 409)
  const unknown = await call(owner, 'POST', `/projects/${project.id}/members`, { email: `nobody.${stamp}@test.local` })
  assert.equal(unknown.status, 404)
  assert.equal(unknown.body.error.code, 'user_not_found')

  // only owners manage members
  assert.equal((await call(editor, 'POST', `/projects/${project.id}/members`, { email: outsider.email })).status, 403)
  assert.equal((await call(editor, 'PATCH', `/projects/${project.id}`, { name: 'Hacked' })).status, 403)

  // outsiders can't even tell the project exists
  assert.equal((await call(outsider, 'GET', `/projects/${project.id}`)).status, 404)
  assert.equal((await call(outsider, 'GET', `/projects/${project.id}/members`)).status, 404)
  assert.equal((await call(outsider, 'GET', '/projects')).body.projects.length, 0)

  // viewer can read, not write
  assert.equal((await call(viewer, 'GET', `/projects/${project.id}`)).body.project.role, 'viewer')
  assert.equal((await call(viewer, 'POST', `/projects/${project.id}/deliverables`, { title: 'x' })).status, 403)

  // owner updates
  const patched = await call(owner, 'PATCH', `/projects/${project.id}`, { health_status: 'on_track' })
  assert.equal(patched.body.project.health_status, 'on_track')
  assert.equal((await call(owner, 'PATCH', `/projects/${project.id}`, { health_status: 'bogus' })).status, 400)
  assert.equal((await call(owner, 'PATCH', `/projects/${project.id}`, {})).status, 400)

  // team list is ordered owner first
  const members = (await call(viewer, 'GET', `/projects/${project.id}/members`)).body.members
  assert.deepEqual(members.map((m) => m.role), ['owner', 'editor', 'viewer'])

  // last owner can't leave or be demoted
  assert.equal((await call(owner, 'PATCH', `/projects/${project.id}/members/${owner.user.id}`, { role: 'editor' })).body.error.code, 'last_owner')
  assert.equal((await call(owner, 'DELETE', `/projects/${project.id}/members/${owner.user.id}`)).status, 409)
  // a member can leave by themselves, but can't remove others
  assert.equal((await call(editor, 'DELETE', `/projects/${project.id}/members/${viewer.user.id}`)).status, 403)
  assert.equal((await call(viewer, 'DELETE', `/projects/${project.id}/members/${viewer.user.id}`)).status, 204)
  assert.equal((await call(viewer, 'GET', `/projects/${project.id}`)).status, 404)
  // promote editor to owner, then the first owner may leave
  assert.equal((await call(owner, 'PATCH', `/projects/${project.id}/members/${editor.user.id}`, { role: 'owner' })).status, 200)
  assert.equal((await call(owner, 'DELETE', `/projects/${project.id}/members/${owner.user.id}`)).status, 204)

  // archive -> read-only -> delete only once archived
  assert.equal((await call(editor, 'DELETE', `/projects/${project.id}`)).body.error.code, 'not_archived')
  const archived = await call(editor, 'POST', `/projects/${project.id}/archive`)
  assert.ok(archived.body.project.archived_at)
  const blocked = await call(editor, 'POST', `/projects/${project.id}/deliverables`, { title: 'late' })
  assert.equal(blocked.status, 409)
  assert.equal(blocked.body.error.code, 'project_archived')
  assert.equal((await call(editor, 'GET', '/projects?archived=true')).body.projects.length, 1)
  assert.equal((await call(editor, 'GET', '/projects?archived=false')).body.projects.length, 0)
  assert.equal((await call(editor, 'POST', `/projects/${project.id}/unarchive`)).body.project.archived_at, null)
  await call(editor, 'POST', `/projects/${project.id}/archive`)
  assert.equal((await call(editor, 'DELETE', `/projects/${project.id}`)).status, 204)
  assert.equal((await call(editor, 'GET', `/projects/${project.id}`)).status, 404)
})

test('deliverables, tasks (kanban move), comments and assets end to end', async () => {
  const owner = await newUser('flow-owner')
  const editor = await newUser('flow-editor')
  const viewer = await newUser('flow-viewer')
  const outsider = await newUser('flow-outsider')
  const { project } = (await call(owner, 'POST', '/projects', { name: 'Flow' })).body
  await call(owner, 'POST', `/projects/${project.id}/members`, { email: editor.email, role: 'editor' })
  await call(owner, 'POST', `/projects/${project.id}/members`, { email: viewer.email, role: 'viewer' })

  // ---- deliverable
  const badDate = await call(editor, 'POST', `/projects/${project.id}/deliverables`, { title: 'D', publish_date: '2026-02-31' })
  assert.equal(badDate.status, 400)
  const d = (await call(editor, 'POST', `/projects/${project.id}/deliverables`, { title: 'Trailer', platform: 'youtube', publish_date: '2026-07-14' })).body.deliverable
  assert.equal(d.stage, 'concept') // no tasks yet
  assert.equal(d.publish_date, '2026-07-14') // plain date string, no timezone shift
  assert.equal((await call(editor, 'POST', `/deliverables/${d.id}/revisions`)).body.deliverable.revision_round, 1)

  // ---- tasks: appended at the bottom of their column
  const mk = async (body) => (await call(editor, 'POST', `/deliverables/${d.id}/tasks`, body)).body.task
  const t1 = await mk({ title: 'A', stage: 'script' })
  const t2 = await mk({ title: 'B', stage: 'editing', assignee_ids: [editor.user.id], due_date: '2026-08-01' })
  const t3 = await mk({ title: 'C' })
  const t4 = await mk({ title: 'D', status: 'doing' })
  assert.deepEqual([t1, t2, t3].map((t) => t.position), [0, 1, 2])
  assert.equal(t4.position, 0)
  assert.equal(t2.due_date, '2026-08-01')

  // assignee must be a project member
  const stranger = await call(editor, 'POST', `/deliverables/${d.id}/tasks`, { title: 'X', assignee_ids: [outsider.user.id] })
  assert.equal(stranger.status, 400)
  assert.ok(stranger.body.error.details.assignee_ids)

  // stage is derived from the tasks (furthest one wins) and progress counts "done"
  assert.equal((await call(editor, 'GET', `/deliverables/${d.id}`)).body.deliverable.stage, 'editing')

  // move C to the top of "doing"
  const moved = await call(editor, 'PATCH', `/tasks/${t3.id}/move`, { status: 'doing', position: 0 })
  assert.equal(moved.status, 200)
  const board = (await call(viewer, 'GET', `/deliverables/${d.id}/tasks`)).body.tasks
  assert.deepEqual(board.map((t) => `${t.status}:${t.position}:${t.title}`), ['todo:0:A', 'todo:1:B', 'doing:0:C', 'doing:1:D'])
  assert.deepEqual(moved.body.tasks.map((t) => t.id), board.map((t) => t.id))

  // move B to "done" (no position = bottom), column "todo" closes the gap
  await call(editor, 'PATCH', `/tasks/${t2.id}/move`, { status: 'done' })
  const board2 = (await call(editor, 'GET', `/deliverables/${d.id}/tasks`)).body.tasks
  assert.deepEqual(board2.map((t) => `${t.status}:${t.position}:${t.title}`), ['todo:0:A', 'doing:0:C', 'doing:1:D', 'done:0:B'])
  // reorder inside a column
  await call(editor, 'PATCH', `/tasks/${t4.id}/move`, { status: 'doing', position: 0 })
  const board3 = (await call(editor, 'GET', `/deliverables/${d.id}/tasks?status=doing`)).body.tasks
  assert.deepEqual(board3.map((t) => t.title), ['D', 'C'])
  assert.equal((await call(editor, 'GET', `/deliverables/${d.id}`)).body.deliverable.progress.done, 1)
  assert.equal((await call(editor, 'GET', `/deliverables/${d.id}/tasks?assignee=me`)).body.tasks.length, 1)

  // edit a task
  const edited = await call(editor, 'PATCH', `/tasks/${t1.id}`, { title: 'A!', description: 'details', stage: null, assignee_ids: [viewer.user.id] })
  assert.equal(edited.body.task.title, 'A!')
  assert.equal(edited.body.task.stage, null)
  assert.deepEqual(edited.body.task.assignee_ids, [viewer.user.id])
  assert.equal((await call(editor, 'PATCH', `/tasks/${t1.id}`, { stage: 'nonsense' })).status, 400)
  assert.equal((await call(viewer, 'PATCH', `/tasks/${t1.id}`, { title: 'nope' })).status, 403)
  assert.equal((await call(viewer, 'PATCH', `/tasks/${t1.id}/move`, { status: 'done' })).status, 403)
  assert.equal((await call(outsider, 'GET', `/tasks/${t1.id}`)).status, 404)

  // ---- comments: viewers may comment, only author/owner may delete
  const c1 = (await call(viewer, 'POST', `/tasks/${t1.id}/comments`, { body: 'Looks great' })).body.comment
  assert.equal(c1.author.id, viewer.user.id)
  assert.equal((await call(viewer, 'POST', `/tasks/${t1.id}/comments`, { body: '   ' })).status, 400)
  const c2 = (await call(editor, 'POST', `/tasks/${t1.id}/comments`, { body: 'Thanks!' })).body.comment
  assert.equal((await call(outsider, 'POST', `/tasks/${t1.id}/comments`, { body: 'hi' })).status, 404)
  assert.deepEqual((await call(owner, 'GET', `/tasks/${t1.id}/comments`)).body.comments.map((c) => c.id), [c1.id, c2.id])
  assert.equal((await call(editor, 'GET', `/tasks/${t1.id}`)).body.task.comment_count, 2)
  assert.equal((await call(editor, 'DELETE', `/comments/${c1.id}`)).status, 403)
  assert.equal((await call(owner, 'DELETE', `/comments/${c1.id}`)).status, 204) // owner moderates
  assert.equal((await call(editor, 'DELETE', `/comments/${c2.id}`)).status, 204) // author

  // ---- assets: link + auto-versioning
  const bad = await call(editor, 'POST', `/deliverables/${d.id}/assets`, { label: 'Evil', url: 'javascript:alert(1)', kind: 'edit' })
  assert.equal(bad.status, 400)
  assert.ok(bad.body.error.details.url)
  const a1 = (await call(editor, 'POST', `/deliverables/${d.id}/assets`, { label: 'Rough cut', url: 'https://example.com/v1', kind: 'edit' })).body.asset
  const a2 = (await call(editor, 'POST', `/deliverables/${d.id}/assets`, { label: 'Rough cut', url: 'https://example.com/v2', kind: 'edit' })).body.asset
  const a3 = (await call(editor, 'POST', `/deliverables/${d.id}/assets`, { label: 'Thumb', url: 'https://example.com/t', kind: 'thumbnail', version: 5 })).body.asset
  assert.deepEqual([a1.version, a2.version, a3.version], [1, 2, 5])
  assert.equal(a1.uploaded_by, editor.user.id)
  assert.equal((await call(viewer, 'POST', `/deliverables/${d.id}/assets`, { label: 'x', url: 'https://a.b', kind: 'edit' })).status, 403)
  assert.equal((await call(viewer, 'GET', `/deliverables/${d.id}/assets?kind=edit`)).body.assets.length, 2)
  assert.equal((await call(viewer, 'GET', `/projects/${project.id}/assets`)).body.assets.length, 3)
  assert.equal((await call(viewer, 'GET', `/deliverables/${d.id}/assets?kind=bogus`)).status, 400)
  assert.equal((await call(editor, 'PATCH', `/assets/${a3.id}`, { label: 'Thumbnail concepts' })).body.asset.label, 'Thumbnail concepts')
  assert.equal((await call(editor, 'DELETE', `/assets/${a3.id}`)).status, 204)

  // ---- project dashboard numbers reflect everything above
  const summary = (await call(owner, 'GET', `/projects/${project.id}`)).body.project
  assert.deepEqual(summary.progress, { done: 1, total: 4 })
  assert.equal(summary.deliverable_count, 1)

  // ---- delete cascade
  assert.equal((await call(editor, 'DELETE', `/tasks/${t4.id}`)).status, 204)
  assert.equal((await call(editor, 'DELETE', `/deliverables/${d.id}`)).status, 204)
  assert.equal((await call(editor, 'GET', `/tasks/${t1.id}`)).status, 404)
  assert.equal((await call(editor, 'GET', `/deliverables/abc`)).status, 404)
})

test('several people per task, add / remove assignees, and leaving a project', async () => {
  const owner = await newUser('team-owner')
  const editor = await newUser('team-editor')
  const viewer = await newUser('team-viewer')
  const outsider = await newUser('team-outsider')
  const { project } = (await call(owner, 'POST', '/projects', { name: 'Team' })).body
  await call(owner, 'POST', `/projects/${project.id}/members`, { email: editor.email, role: 'editor' })
  await call(owner, 'POST', `/projects/${project.id}/members`, { email: viewer.email, role: 'viewer' })
  const d = (await call(editor, 'POST', `/projects/${project.id}/deliverables`, { title: 'Clip' })).body.deliverable

  // a task can be created in any column, with several assignees at once
  const doing = (await call(editor, 'POST', `/deliverables/${d.id}/tasks`, { title: 'Shoot', status: 'doing', assignee_ids: [owner.user.id, editor.user.id, editor.user.id] })).body.task
  assert.equal(doing.status, 'doing')
  assert.deepEqual([...doing.assignee_ids].sort(), [owner.user.id, editor.user.id].sort()) // duplicates dropped
  const done = (await call(editor, 'POST', `/deliverables/${d.id}/tasks`, { title: 'Script', status: 'done' })).body.task
  assert.deepEqual(done.assignee_ids, [])

  // add one person, then another; adding twice changes nothing
  const t = done
  const a1 = await call(editor, 'PUT', `/tasks/${t.id}/assignees/${viewer.user.id}`)
  assert.equal(a1.status, 200)
  assert.deepEqual(a1.body.task.assignee_ids, [viewer.user.id])
  assert.equal((await call(editor, 'PUT', `/tasks/${t.id}/assignees/${viewer.user.id}`)).body.task.assignee_ids.length, 1)
  assert.equal((await call(editor, 'PUT', `/tasks/${t.id}/assignees/${owner.user.id}`)).body.task.assignee_ids.length, 2)

  // only project members can be assigned, only editors+ can change assignees
  const bad = await call(editor, 'PUT', `/tasks/${t.id}/assignees/${outsider.user.id}`)
  assert.equal(bad.status, 400)
  assert.ok(bad.body.error.details.user_id)
  assert.equal((await call(viewer, 'PUT', `/tasks/${t.id}/assignees/${editor.user.id}`)).status, 403)
  assert.equal((await call(viewer, 'DELETE', `/tasks/${t.id}/assignees/${viewer.user.id}`)).status, 403)
  assert.equal((await call(outsider, 'PUT', `/tasks/${t.id}/assignees/${editor.user.id}`)).status, 404)

  // remove one person; PATCH replaces the whole list
  assert.deepEqual((await call(editor, 'DELETE', `/tasks/${t.id}/assignees/${owner.user.id}`)).body.task.assignee_ids, [viewer.user.id])
  const replaced = await call(editor, 'PATCH', `/tasks/${t.id}`, { assignee_ids: [editor.user.id, owner.user.id] })
  assert.deepEqual([...replaced.body.task.assignee_ids].sort(), [owner.user.id, editor.user.id].sort())
  assert.deepEqual((await call(editor, 'PATCH', `/tasks/${t.id}`, { assignee_ids: [] })).body.task.assignee_ids, [])
  assert.equal((await call(editor, 'PATCH', `/tasks/${t.id}`, { assignee_ids: 'nope' })).status, 400)

  // the board carries every task's assignees, and ?assignee=me uses them
  const board = (await call(owner, 'GET', `/deliverables/${d.id}/tasks`)).body.tasks
  assert.equal(board.length, 2)
  assert.equal(board.find((x) => x.id === doing.id).assignee_ids.length, 2)
  assert.deepEqual((await call(owner, 'GET', `/deliverables/${d.id}/tasks?assignee=me`)).body.tasks.map((x) => x.id), [doing.id])

  // leaving the project: you disappear from the project's tasks and lose access
  assert.equal((await call(editor, 'DELETE', `/projects/${project.id}/members/${editor.user.id}`)).status, 204)
  assert.deepEqual((await call(owner, 'GET', `/tasks/${doing.id}`)).body.task.assignee_ids, [owner.user.id])
  assert.equal((await call(editor, 'GET', `/tasks/${doing.id}`)).status, 404)
  const mine = (await call(editor, 'GET', '/projects')).body.projects
  assert.equal(mine.some((p) => p.id === project.id), false)

  // the only owner can't leave: with other members they must promote someone, alone they archive
  const lone = (await call(outsider, 'POST', '/projects', { name: 'Solo' })).body.project
  const solo = await call(outsider, 'DELETE', `/projects/${lone.id}/members/${outsider.user.id}`)
  assert.equal(solo.status, 409)
  assert.equal(solo.body.error.code, 'last_owner')
})
