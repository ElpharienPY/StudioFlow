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

Demo account, created by `npm run db:reset` in `backend/`: **`user1@studioflow.co` / `password123`**. Users `user1` to `user6@studioflow.co` share that password (`user4` is a viewer on "Summer Campaign 2026"). **Use these accounts to try the app.**

### About "Sign in with Google" (bonus feature)

The login page also has a **"Sign in with Google"** button, which works with any Google account:

- It only works on `http://localhost:5173` (not `127.0.0.1`), the origin registered for our Google app.
- The first Google sign-in creates a new, empty StudioFlow account (or links to the existing account with the same email), so the demo accounts above are still the quickest way to see the app with data.
- What StudioFlow stores, with or without Google: [PRIVACY.md](PRIVACY.md).

## Project plan
See [docs/project-plan.md](docs/project-plan.md) for team task distribution, the milestone timeline and progress. Contribution rules are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Tools

Alongside Vue.js, Node.js and MySQL, we used a few AI tools as assistants: Claude Design for the Milestone 1 mockups, Nano Banana Pro for the logo, and Claude Code as a coding assistant across the project, including for the Milestone 3 back-end, its tests and the front/back integration. The project idea, scope and features were defined by the team, and we remain responsible for all the code we submit.
