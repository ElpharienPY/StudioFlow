# StudioFlow
Secure full-stack creative task manager built with Vue.js, Node.js, and MySQL. Features token-based auth and a 3-status pipeline (To Do, Doing, Done) for video and content workflows. MOD8 Course Project.

A team creates **projects**, splits each one into **deliverables** (a trailer, a teaser, a podcast episode…), and tracks each deliverable on a kanban **board** of tasks, with comments, assignees, a production stage and linked **assets**. Access is per project, with three roles: `owner` > `editor` > `viewer`.

## Stack

| Part | Technology | Folder |
|---|---|---|
| Front-end | Vue 3 + Vite, Vue Router, plain CSS | [`frontend/`](frontend/README.md) |
| Back-end | Node.js, Express 5, REST API, JWT access tokens + rotating refresh tokens (httpOnly cookie), bcrypt | [`backend/`](backend/README.md) |
| Database | MySQL (`mysql2`), schema in `db/schema.sql` | [`db/`](db/schema.sql) |

## Getting started

- Quick start on Windows (in French): [DEMARRAGE.md](DEMARRAGE.md)
- Back-end setup, API endpoints, roles and auth flow: [backend/README.md](backend/README.md)
- Front-end structure and conventions: [frontend/README.md](frontend/README.md)

Demo account, created by `npm run db:reset` in `backend/`: **`user1@studioflow.co` / `password123`**. Users `user1` to `user6@studioflow.co` share that password (`user4` is a viewer on "Summer Campaign 2026").

## Project plan
See [docs/project-plan.md](docs/project-plan.md) for team task distribution, the milestone timeline and progress. Contribution rules are in [CONTRIBUTING.md](CONTRIBUTING.md).

We set up the repo organization (branching convention, DB schema, GitHub templates) with the help of Claude Code. We designed the UI mockups in `docs/` with the help of Claude Design, and used Claude Code to help with parts of the front-end code. The logo (`frontend/src/assets/studioflow-logo.png`) was generated with Nano Banana Pro to save time and quickly land on an art direction, which then drove the front-end's design tokens (see `frontend/README.md`).
