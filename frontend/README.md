# StudioFlow — Front-end

Vue 3 (`<script setup>`) + Vite, Vue Router. Built for Milestone 2 against
mock data shaped like our real schema — the actual API lands in Milestone 3.

## Stack, and why

- **Vue 3 + Vite**: matches what we committed to in the root README, and
  Vite's dev server gives us instant feedback while iterating on screens.
- **Vue Router**: every screen in the sidebar (Projects, Boards,
  Deliverables, Assets, Team) is a real route, including the task detail
  panel (`/boards/:taskId`) — so the back/forward buttons and page refresh
  behave the way a reviewer expects, instead of everything living in one
  component's local state.
- **No state-management library (no Pinia)**: `stores/auth.js` and
  `stores/projects.js` are the single source of truth for session state and
  all the mock project/task/deliverable data, but they're just plain Vue
  `reactive()` objects — `useAuthStore()` / `useProjectsStore()` return the
  same module-level singleton every time, with `get` accessors standing in
  for computed getters. Centralizing the data there (instead of passing
  props down through every component) still means that swapping in real API
  calls in Milestone 3 touches two files, not every view — a dedicated
  library like Pinia wasn't pulling its weight for an app this size, and
  Vue's own reactivity already gives us the same pattern for free.

## Styling: plain CSS, not Tailwind

We first reached for Tailwind CSS — it's a fast fit for the mockups' custom
dark design system (lots of small variant states: status pills, a stepper,
avatar stacks). But our professor teaches a Tailwind course on
good4college.com, and we couldn't confirm our setup would match those
conventions — the lesson page is client-rendered and gated, so it wasn't
fetchable to check. Rather than risk contradicting something specifically
taught in class, we switched to plain CSS: one `<style scoped>` block per
`.vue` component, with design tokens as CSS custom properties in
`src/style.css`. That also has a real upside for the team — Théodore and
Guillaume inherit these files without first needing to learn a utility-class
framework, and there's one less dependency in the build.

## Design direction

We went with a dark navy + indigo system, derived from the Milestone 1
mockups (`docs/StudioFlow — UI Mockups (Milestone 1) FINAL (1).pdf`) and the
logo (`src/assets/studioflow-logo.png`), which we generated with Nano Banana
Pro to save time and quickly land on an art direction rather than designing
one from scratch. All colors/spacing/radii live as CSS custom properties in
`src/style.css` and get reused everywhere instead of hardcoded values.

## Mock data & auth

There's no back-end yet, so `src/data/fixtures.js` plays that role for now:
plain JS objects shaped exactly like the `db/schema.sql` tables — same field
names, same enum values (`health_status`, `stage`, `kind`, etc.). The stores
read and mutate that data as if it came from an API, so wiring up real HTTP
calls in Milestone 3 should mean rewriting the inside of the store methods,
not renaming anything the components depend on.

Auth works the same way: `stores/auth.js` does a mock sign-in/sign-up
against the fixture users (no password is actually checked — there's
nothing to check it against yet) and persists the session to `localStorage`.
The route guard in `router/index.js` treats that the same way it'll treat a
real session later.

### Dev sign-in shortcut

We iterated through dozens of reloads a day building this, and every one of
them landed back on `/login` because the route guard requires a session.
Since mock auth always "succeeds" for a known email, retyping credentials
each time tested nothing — it just slowed down iteration. So we added a
**"⚡ Dev sign-in"** button on the login screen that signs in instantly as
the seed user. It's gated behind `import.meta.env.DEV`, so it's compiled out
of `npm run build` and never reaches the graded/production build — the real
Login/Signup form (and its validation) stays exactly what gets reviewed and
what Milestone 3's real auth will replace.

### Mock user names

Mock users are deliberately generic (`User 1`, `User 2`, ...,
`user1@studioflow.co`, ...) instead of realistic-sounding names. This is
dev/placeholder data, not production content, and we wanted that obvious at
a glance rather than accidentally reading as real people.

## Conventions

- **No CSS framework**: plain CSS, one `<style scoped>` block per `.vue`
  component (see "Styling" above).
- **Design tokens** centralized in `src/style.css`
  (`:root { --color-..., --space-..., --radius-... }`). Always reuse these
  variables instead of hardcoded values.
- **Mock data** lives in `src/data/fixtures.js`, read through the stores in
  `src/stores/` (plain Vue `reactive()`, no state-management library) —
  components never import fixtures directly.
- Everything in this repo (code, comments, docs, commit messages) is in
  English, team-voiced ("we"), per our workflow convention.

## Run the project

```bash
npm install
npm run dev
```
