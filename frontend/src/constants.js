// OAuth client id of our Google app (Google Cloud project "StudioFlow"), used by the "Sign in with
// Google" button. A client id is public by design (it ends up in the page anyway); the client
// secret is never used by the front-end and is not in the repo. VITE_GOOGLE_CLIENT_ID overrides it,
// and an empty value hides the button. Must match GOOGLE_CLIENT_ID in the back-end.
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '872128360491-0cu0ql4s6uthfq2hbanuf5c7cfnugdqe.apps.googleusercontent.com'

// Production stages of a deliverable, in order (same values as the `tasks.stage` enum in db/schema.sql).
export const STAGE_ORDER = ['concept', 'script', 'shooting', 'editing', 'thumbnail', 'publishing']

// Platforms a deliverable is made for (same values as the `deliverables.platform` enum).
export const PLATFORMS = ['youtube', 'tiktok', 'instagram', 'client', 'other']

// Kinds of asset (same values as the `assets.kind` enum).
export const ASSET_KINDS = ['script', 'raw_footage', 'edit', 'thumbnail', 'export']

// The three kanban columns (same values as the `tasks.status` enum).
export const COLUMNS = [
  { status: 'todo', title: 'To Do', color: '#fbbf24' },
  { status: 'doing', title: 'Doing', color: '#60a5fa' },
  { status: 'done', title: 'Done', color: '#34d399' },
]
