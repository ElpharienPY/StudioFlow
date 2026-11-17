# StudioFlow — Project Plan

## Team and task distribution

Split by vertical feature, aligned with the database tables. Each person owns
their vertical end to end, from front-end (Milestone 2) to back-end
(Milestone 3), for a clear split of work between the 3 members.

| Person | Vertical | Scope | Tables |
|---|---|---|---|
| **Raphaël** | Auth & Team | Signup/login, token sessions, Google sign-in, member & role management | `users`, `accounts`, `refresh_tokens`, `project_members` |
| **Théodore** | Boards & Tasks | Kanban (To Do/Doing/Done columns), task detail, comments | `tasks`, `task_assignees`, `comments` |
| **Guillaume** | Projects & Deliverables | Projects dashboard, deliverable view (production stepper, assets) | `projects`, `deliverables`, `assets` |

*Théodore/Guillaume split still to be confirmed between them — both verticals
are interchangeable.*

## Timeline

| Step | Target date | Content |
|---|---|---|
| Milestone 1 | Oct 5, 2026 | Problem statement, ERD, mockups, project plan |
| Front-end — auth & app skeleton | Oct 19, 2026 | Vue.js layout, routing, static screens |
| Front-end — 3 verticals integration | Nov 2, 2026 | Dynamic components per vertical |
| **Milestone 2** | **Nov 9, 2026** | Complete front-end on GitHub |
| Back-end — API + DB per vertical | Nov 30, 2026 | Node.js routes, MySQL queries per vertical |
| Front/back integration + tests | Dec 7, 2026 | Full connection, bug fixes |
| **Milestone 3** | **Dec 14, 2026** | Complete back-end, presentation (5–7 min) |

## Notes

- Auth & Team is the most complex vertical (security, tokens, OAuth) and
  blocks the other two for end-to-end testing — start it first.
- A deliverable's current stage (seen in the mockups) is computed from its
  tasks, not stored — a light coupling between Boards & Tasks and Projects &
  Deliverables to keep in mind at integration time.

## Milestone 2 progress (Oct 2026)

- Front-end scaffolded with Vue 3 + Vite + Vue Router (state handled with
  plain Vue `reactive()`, no extra state-management library), plain CSS
  (design tokens as CSS custom properties in `frontend/src/style.css`) —
  see `frontend/README.md` for conventions.
- Built against mock data (`frontend/src/data/fixtures.js`) shaped like the
  `db/schema.sql` tables, since the back-end lands in Milestone 3.
- Task distribution (verticals, see table above) is unchanged from
  Milestone 1.
- Full write-up: [docs/StudioFlow — Milestone 2.docx](StudioFlow — Milestone 2.docx).

## Milestone 3 progress (Nov 2026)

What is in the repository, based on the code and the Git history (the
back-end and the front-end wiring landed on `main` on Nov 16, 2026, commits
`70b5e16`, `7559f47` and `b4ca941`).

**Task distribution for Milestone 3**

> **TODO (team):** who did what on the back-end and on the front/back
> integration, per vertical. To be filled in by the team — not derivable
> from the Git history alone.

**Done**

- **Back-end REST API** in `backend/` (Node.js, Express 5, `mysql2`), split
  by vertical in `backend/src/modules/` (`auth`, `boards`, `deliverables`),
  with shared middleware (authentication, per-project access, rate limit,
  errors) and input validation by whitelist (`backend/src/utils/validate.js`).
  All SQL queries use placeholders.
- **Auth & Team**: signup, login, logout, logout of every session, `GET
  /auth/me`; 15-min JWT access token + refresh token in an `httpOnly` cookie,
  rotated on every use and stored as a SHA-256 hash; passwords hashed with
  bcrypt (cost 12); login/signup limited to 20 attempts per 15 min per IP.
  Members: invite by email, change role, remove, leave; a project always
  keeps at least one owner. Bonus: "Sign in with Google" (Google's button,
  token checked by the API with Google); our Google app is in "Testing"
  mode, so only its registered test users can use it.
- **Projects & Deliverables**: projects (create, edit, archive/unarchive,
  delete once archived), deliverables (create, edit, delete, new revision
  round), assets as links with versions. A deliverable's stage is computed
  in SQL from its tasks, not stored.
- **Boards & Tasks**: tasks (create, edit, delete), several assignees per
  task (new `task_assignees` table, migration
  `db/migrations/001_task_assignees.sql`), drag & drop move in a transaction
  (`SELECT … FOR UPDATE` and position renumbering), comments.
- **Roles**: `owner` > `editor` > `viewer`; non-members get `404`; archived
  projects are read-only (`409`); viewers can comment.
- **Database**: 10 tables in `db/schema.sql`; `npm run db:reset` loads the
  demo data.
- **Front-end wired to the API** (`frontend/src/api.js` and the stores):
  sign in / sign up, session kept across reloads, sign out of all devices,
  projects dashboard (create, archive, restore, delete once archived),
  deliverables (create), assets (add as a link, delete), kanban with drag &
  drop and status menu, task detail (title, description, due date, stage,
  assignees, delete, comments with deletion by the author or an owner), team
  management. Write actions are hidden from viewers and on archived projects.
- **Tests**: 8 integration tests (`npm test` in `backend/`, Node's built-in
  test runner, against a separate MySQL test database).

**Available in the API but without a screen yet**

Editing a project or its health status, editing/deleting a deliverable,
starting a new revision round, editing an asset.

**Remaining for Dec 14, 2026**

- Final Milestone 3 write-up in `docs/` — TODO.
- Presentation (5–7 min) — TODO.
