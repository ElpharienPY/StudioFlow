// Production stages of a deliverable, in order (same values as the `tasks.stage` enum in db/schema.sql).
export const STAGE_ORDER = ['concept', 'script', 'shooting', 'editing', 'thumbnail', 'publishing']

// Platforms a deliverable is made for (same values as the `deliverables.platform` enum).
export const PLATFORMS = ['youtube', 'tiktok', 'instagram', 'client', 'other']

// The three kanban columns (same values as the `tasks.status` enum).
export const COLUMNS = [
  { status: 'todo', title: 'To Do', color: '#fbbf24' },
  { status: 'doing', title: 'Doing', color: '#60a5fa' },
  { status: 'done', title: 'Done', color: '#34d399' },
]
