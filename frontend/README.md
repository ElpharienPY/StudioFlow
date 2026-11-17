# StudioFlow — Front-end

Vue 3 (`<script setup>`) + Vite, Vue Router. The app talks to the StudioFlow
REST API in `../backend` (see `backend/README.md` for the endpoints).

## Stack, and why

- **Vue 3 + Vite**: matches what we committed to in the root README, and
  Vite's dev server gives us instant feedback while iterating on screens.
- **Vue Router**: every screen in the sidebar (Projects, Boards,
  Deliverables, Assets, Team) is a real route, including the task detail
  panel (`/boards/:taskId`) — so the back/forward buttons and page refresh
  behave the way a reviewer expects, instead of everything living in one
  component's local state.
- **No state-management library (no Pinia)**: `stores/auth.js` and
  `stores/projects.js` are the single source of truth for the session and
  the project/deliverable/task/comment/asset data, but they're just plain Vue
  `reactive()` objects — `useAuthStore()` / `useProjectsStore()` return the
  same module-level singleton every time, with `get` accessors standing in
  for computed getters. A dedicated library like Pinia wasn't pulling its
  weight for an app this size, and Vue's own reactivity already gives us the
  same pattern for free.

## Styling: plain CSS, not Tailwind

We first reached for Tailwind CSS — it's a fast fit for the mockups' custom
dark design system (lots of small variant states: status pills, a stepper,
avatar stacks). We switched to plain CSS instead: one `<style scoped>` block
per `.vue` component, with design tokens as CSS custom properties in
`src/style.css`. That keeps the setup simple for the whole team — no one
needs to learn a utility-class framework first — and there's one less
dependency in the build.

## Design direction

We went with a dark navy + indigo system, derived from the Milestone 1
mockups (`docs/StudioFlow — UI Mockups (Milestone 1) FINAL (1).pdf`) and the
logo (`src/assets/studioflow-logo.png`), which we generated with Nano Banana
Pro to save time and quickly land on an art direction rather than designing
one from scratch. All colors/spacing/radii live as CSS custom properties in
`src/style.css` and get reused everywhere instead of hardcoded values.

## Talking to the API

- **`src/api.js`** is a small `fetch` wrapper used by the stores. The API
  URL comes from `VITE_API_URL` (optional, in `frontend/.env`) and defaults to
  `http://localhost:4000`. Every request is sent with
  `credentials: 'include'` so the browser attaches the refresh cookie.
  API errors are thrown as `ApiError { status, code, message, details }`.
- **Access token in memory only**: the short-lived access token (15 min)
  returned by `/auth/login`, `/auth/signup` and `/auth/refresh` is kept in a
  module variable in `api.js` and sent as `Authorization: Bearer …`. It is
  never written to `localStorage` or a cookie.
- **Refresh cookie**: the refresh token is an `httpOnly` cookie set by the
  back-end (path `/auth`), so JavaScript never reads it. When a request gets
  `401 token_expired`, `api.js` calls `POST /auth/refresh` once — concurrent
  requests share the same pending refresh — then retries the request. If the
  refresh fails, the session is cleared and the app goes back to `/login`.
- **Page reload**: `main.js` calls `auth.init()` before mounting, which tries
  `POST /auth/refresh` with the cookie, so a reload keeps the user signed in.
- **Stores**: views read synchronously from the stores (`store.tasksOf(id)`,
  `store.membersOf(id)`…). The `load*` actions fetch from the API; every write
  calls the API first, then updates the local state with what the server
  returned. A failed write puts its message in `store.error`, shown as a
  banner by `AppShell`. The only thing kept in `localStorage` is the id of
  the last opened project (`studioflow.activeProject`), a UI convenience.
- **Roles**: `store.canEditProject(projectId)` (owner or editor, project not
  archived) decides whether write actions are shown; viewers can still
  comment. The back-end enforces the same rules in any case.

### Dev sign-in shortcut

The login screen has a **"⚡ Dev sign-in"** button that signs in as the demo
user created by `npm run db:seed` (`user1@studioflow.co`), so we don't retype
credentials on every reload while iterating. It is rendered only when
`import.meta.env.DEV` is true, i.e. with `npm run dev`; it is hidden in
`npm run build`. Its code — including the demo email and password — is still
present in the production bundle, it is just never displayed.

### Demo user names

Demo users are deliberately generic (`User 1`, `User 2`, ...,
`user1@studioflow.co`, ...) instead of realistic-sounding names. This is
placeholder data, not production content, and we wanted that obvious at a
glance rather than accidentally reading as real people. The back-end seed
script loads them from `src/data/fixtures.js`; the app itself never imports
that file.

## Conventions

- **No CSS framework**: plain CSS, one `<style scoped>` block per `.vue`
  component (see "Styling" above).
- **Design tokens** centralized in `src/style.css`
  (`:root { --color-..., --space-..., --radius-... }`). Always reuse these
  variables instead of hardcoded values.
- **Data access** goes through the stores in `src/stores/` — components
  never call `fetch` or `api.js` directly.
- Everything in this repo (code, comments, docs, commit messages) is in
  English, team-voiced ("we"), per our workflow convention.

## Run the project

The back-end must be running first (see `../backend/README.md` or
`../DEMARRAGE.md`).

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # production build in dist/
```
