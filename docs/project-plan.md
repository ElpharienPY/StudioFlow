# StudioFlow — Project Plan

## Team and task distribution

Split by vertical feature, aligned with the database tables. Each person owns
their vertical end to end, from front-end (Milestone 2) to back-end
(Milestone 3), for a clear split of work between the 3 members.

| Person | Vertical | Scope | Tables |
|---|---|---|---|
| **Raphaël** | Auth & Team | Signup/login, token sessions, Google sign-in, member & role management | `users`, `accounts`, `refresh_tokens`, `project_members` |
| **Théodore** | Boards & Tasks | Kanban (To Do/Doing/Done columns), task detail, comments | `tasks`, `comments` |
| **Guillaume** | Projects & Deliverables | Projects dashboard, deliverable view (production stepper, assets) | `projects`, `deliverables`, `assets` |

*Théodore/Guillaume split still to be confirmed between them — both verticals
are interchangeable.*

## Timeline

To confirm against the course's official dates if they differ.

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
