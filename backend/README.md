# StudioFlow — Back-end (REST API)

Node.js · Express 5 · MySQL (`mysql2`) · JWT access tokens + rotating refresh tokens (`jsonwebtoken`, `bcrypt`).

Code is split by vertical, same as the project plan:

| Folder | Vertical | Tables |
|---|---|---|
| `src/modules/auth` | Auth & Team — signup/login/refresh/Google, members & roles | `users`, `accounts`, `refresh_tokens`, `project_members` |
| `src/modules/deliverables` | Projects & Deliverables — projects, deliverables, assets | `projects`, `deliverables`, `assets` |
| `src/modules/boards` | Boards & Tasks — kanban, task detail, comments | `tasks`, `task_assignees`, `comments` |

Shared code: `src/middleware` (auth, per-project access, errors, rate limit), `src/utils` (validation, serializers), `src/db/pool.js`.

## Setup

1. **MySQL user** (once, as root):
   ```sql
   CREATE USER IF NOT EXISTS 'studioflow'@'localhost'  IDENTIFIED BY 'studioflow';
   CREATE USER IF NOT EXISTS 'studioflow'@'127.0.0.1'  IDENTIFIED BY 'studioflow';
   GRANT ALL PRIVILEGES ON *.* TO 'studioflow'@'localhost';
   GRANT ALL PRIVILEGES ON *.* TO 'studioflow'@'127.0.0.1';
   ```
   (`db:init` runs `CREATE DATABASE`, hence the global grant — fine for local dev, narrow it in production.)
2. `cp .env.example .env` and adjust it (never commit `.env`). An existing `.env` keeps working.
3. `npm install`
4. `npm run db:reset` — creates the 10 tables from `../db/schema.sql` **and** loads demo data (from `frontend/src/data/fixtures.js`).
   Demo login: `user1@studioflow.co` / `password123` (users 1–6 share that password).
5. `npm run dev` → http://localhost:4000 (`GET /health`, `GET /health/db`)

| Script | What it does |
|---|---|
| `npm run dev` / `npm start` | API with nodemon / plain node |
| `npm run db:init` | drops & recreates all tables (**erases data**) |
| `npm run db:seed` | empties the tables and loads demo data (**erases data**) |
| `npm run db:reset` | both |
| `npm test` | 8 integration tests against a real MySQL database. They use a separate database, `DB_NAME` + `_test` (or `TEST_DB_NAME`), recreated at every run, so the demo data is never touched |

## Conventions

- JSON in, JSON out. Field names match `db/schema.sql` (`snake_case`). `DATE` columns are `"YYYY-MM-DD"`, timestamps are ISO-8601 UTC.
- Errors always look like `{ "error": { "code": "...", "message": "...", "details": { "field": "reason" } } }`.
  Statuses: `400` validation · `401` not logged in · `403` role too low · `404` not found *or not a member* · `409` conflict · `429` too many attempts.
- Every protected route needs `Authorization: Bearer <accessToken>`.
  A `401` with `code: "token_expired"` means: call `POST /auth/refresh`, then retry.
- Lists are wrapped (`{ "projects": [...] }`), single items too (`{ "project": {...} }`). Deletes return `204`.

## Auth flow

- `POST /auth/signup` or `/auth/login` → body `{ accessToken, user }` + an **httpOnly cookie** `refresh_token` (path `/auth`).
  The access token lives 15 min (keep it in memory); the refresh token 30 days.
- `POST /auth/refresh` (cookie, no body) → new `accessToken`; the refresh token **rotates** (each one works once).
  Reusing an old one is rejected; reusing one long after rotation revokes every session of that user (token-theft signal).
- The front must call the API with `credentials: 'include'` (CORS is already set up for `CORS_ORIGIN`).
- Refresh tokens are stored hashed (sha-256), passwords with bcrypt (cost 12). Login/signup are rate limited (20 / 15 min / IP).
- Google sign-in: set `GOOGLE_CLIENT_ID` (and the same id as `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` to show the button).
  The front sends the Google Identity Services `credential` (an ID token) to `POST /auth/google`; the API checks it with
  Google (signature, expiry, audience, issuer, verified email). The first Google sign-in is linked to the account with the
  same email, or creates one (`accounts` table). Without the variable the route answers `501`.
  The OAuth client is a "Web application" with `http://localhost:5173` as authorized JavaScript origin; while the Google
  app is in "Testing" mode, only the test users listed in Google Auth Platform > Audience can sign in.

## Roles

`owner` > `editor` > `viewer`, per project. Non-members get `404` (the project's existence is not revealed).

| | viewer | editor | owner |
|---|:-:|:-:|:-:|
| read project, deliverables, tasks, comments, assets, members | ✅ | ✅ | ✅ |
| comment on tasks, delete own comment | ✅ | ✅ | ✅ |
| create/edit/move/delete tasks, deliverables, assets | | ✅ | ✅ |
| edit project, change health status, archive, delete (once archived) | | | ✅ |
| invite members, change roles, remove others, delete any comment | | | ✅ |

Any member can leave a project by removing themselves (`DELETE /projects/:id/members/<my id>`); they are also taken off that project's tasks. A project always keeps at least one owner: the last owner gets `409 last_owner` (promote someone else first, or archive the project if they are alone).
**Archived projects are read-only** (`409 project_archived`) until an owner unarchives them.

## Endpoints

### Auth & Team
| Method & path | Notes |
|---|---|
| `POST /auth/signup` `{full_name, email, password}` | password 8–72 chars |
| `POST /auth/login` `{email, password}` | same error whether the email exists or not |
| `POST /auth/google` `{credential}` | |
| `POST /auth/refresh` | cookie |
| `POST /auth/logout` · `POST /auth/logout-all` | this session / every device |
| `GET /auth/me` | |
| `GET /projects/:id/members` | |
| `POST /projects/:id/members` `{email, role?}` | owner. `404 user_not_found` if no account yet |
| `PATCH /projects/:id/members/:userId` `{role}` | owner |
| `DELETE /projects/:id/members/:userId` | owner, or yourself to leave |

### Projects & Deliverables
| Method & path | Notes |
|---|---|
| `GET /projects?archived=true\|false\|all` | includes `role`, `progress {done,total}`, `deliverable_count`, `members[]` |
| `POST /projects` `{name, description?, health_status?}` | creator becomes owner |
| `GET /projects/:id` · `PATCH /projects/:id` | patch: owner |
| `POST /projects/:id/archive` · `/unarchive` | owner (soft delete) |
| `DELETE /projects/:id` | owner, only when archived |
| `GET /projects/:id/deliverables` | sorted by publish date; each has computed `stage` and `progress` |
| `POST /projects/:id/deliverables` `{title, platform?, publish_date?}` | editor+ |
| `GET /deliverables/:id` · `PATCH` · `DELETE` | editor+ to write |
| `POST /deliverables/:id/revisions` | `revision_round + 1` |
| `GET /deliverables/:id/assets?kind=` · `GET /projects/:id/assets?kind=` | |
| `POST /deliverables/:id/assets` `{label, url, kind, version?}` | `url` must be http(s); `version` defaults to the next version of the same label+kind |
| `PATCH /assets/:id` · `DELETE /assets/:id` | editor+ |

A deliverable's `stage` is not stored: it is the furthest production stage (`concept → … → publishing`) among its tasks.

### Boards & Tasks
| Method & path | Notes |
|---|---|
| `GET /deliverables/:id/tasks?status=&assignee=me` | the board, ordered by column then position |
| `POST /deliverables/:id/tasks` `{title, description?, status?, stage?, assignee_ids?, due_date?}` | added at the bottom of its column (`status` = `todo`/`doing`/`done`); every assignee must be a project member |
| `GET /tasks/:id` · `PATCH /tasks/:id` · `DELETE /tasks/:id` | `PATCH` takes `{title?, description?, stage?, assignee_ids?, due_date?}`; `assignee_ids` **replaces** the whole list |
| `PUT /tasks/:id/assignees/:userId` | editor+. Adds one person to the task (no-op if already there). Returns `{task}` |
| `DELETE /tasks/:id/assignees/:userId` | editor+. Takes one person off the task. Returns `{task}` (200, not 204) |
| `PATCH /tasks/:id/move` `{status, position?}` | drag & drop; positions renumbered atomically; returns `{task, tasks}` (whole board) |
| `GET /tasks/:taskId/comments` · `POST /tasks/:taskId/comments` `{body}` | viewers can comment |
| `DELETE /comments/:id` | author or owner |

`status` (kanban column: `todo`/`doing`/`done`) and `stage` (production step) are independent.

## Notes

- Deleting a user account is not exposed by the API; the FK rules in `schema.sql` already define the effects.
- The rate limiter is in-memory (one process). Behind a reverse proxy, add `app.set('trust proxy', 1)`.
- Production: `NODE_ENV=production` (secure cookies, no error details in 500s, `db:init`/`db:seed` refuse to run) and HTTPS.
  If front and API end up on different *sites*, the cookie needs `SameSite=None; Secure` (see `baseCookie` in `modules/auth/tokens.js`).
