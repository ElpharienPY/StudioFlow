// Mock data shaped like the `db/schema.sql` rows (same field names / enum
// values) so swapping in real API responses in Milestone 3 is a drop-in,
// not a rewrite.

// Deliberately generic placeholder identities (not real-sounding names) since
// this is mock/dev data, not production content — see frontend/README.md.
export const users = [
  { id: 1, full_name: 'User 1', email: 'user1@studioflow.co', initials: 'U1', color: '#6366f1' },
  { id: 2, full_name: 'User 2', email: 'user2@studioflow.co', initials: 'U2', color: '#10b981' },
  { id: 3, full_name: 'User 3', email: 'user3@studioflow.co', initials: 'U3', color: '#a855f7' },
  { id: 4, full_name: 'User 4', email: 'user4@studioflow.co', initials: 'U4', color: '#ec4899' },
  { id: 5, full_name: 'User 5', email: 'user5@studioflow.co', initials: 'U5', color: '#06b6d4' },
  { id: 6, full_name: 'User 6', email: 'user6@studioflow.co', initials: 'U6', color: '#f59e0b' },
]

export const projects = [
  {
    id: 1,
    name: 'Summer Campaign 2026',
    description: '6 deliverables across YouTube & TikTok',
    health_status: 'on_track',
    archived_at: null,
  },
  {
    id: 2,
    name: 'Brand Refresh — TikTok Series',
    description: 'Short-form weekly drops, 8 episodes',
    health_status: 'in_production',
    archived_at: null,
  },
  {
    id: 3,
    name: 'Q3 Product Launch',
    description: 'Hero film, teasers & social cutdowns',
    health_status: 'almost_done',
    archived_at: null,
  },
  {
    id: 4,
    name: 'The Weekly Cut — Podcast',
    description: 'Audiogram + YouTube episode pipeline',
    health_status: 'in_production',
    archived_at: null,
  },
  {
    id: 5,
    name: 'Client · Aurora Skincare',
    description: 'Product reveal + 4 UGC-style spots',
    health_status: 'kickoff',
    archived_at: null,
  },
  {
    id: 6,
    name: 'Holiday Teaser Pack',
    description: 'Two 15s teasers for the winter drop',
    health_status: 'on_track',
    archived_at: null,
  },
  {
    id: 7,
    name: 'Spring Lookbook 2025',
    description: 'Lookbook photo + motion set',
    health_status: 'on_track',
    archived_at: '2025-06-20T10:00:00Z',
  },
]

export const projectMembers = [
  { project_id: 1, user_id: 1, role: 'owner' },
  { project_id: 1, user_id: 2, role: 'editor' },
  { project_id: 1, user_id: 3, role: 'editor' },
  { project_id: 1, user_id: 4, role: 'viewer' },
  { project_id: 2, user_id: 3, role: 'owner' },
  { project_id: 2, user_id: 5, role: 'editor' },
  { project_id: 2, user_id: 4, role: 'editor' },
  { project_id: 3, user_id: 1, role: 'owner' },
  { project_id: 3, user_id: 6, role: 'editor' },
  { project_id: 3, user_id: 2, role: 'editor' },
  { project_id: 4, user_id: 5, role: 'owner' },
  { project_id: 4, user_id: 3, role: 'editor' },
  { project_id: 5, user_id: 4, role: 'owner' },
  { project_id: 5, user_id: 1, role: 'editor' },
  { project_id: 5, user_id: 2, role: 'editor' },
  { project_id: 6, user_id: 1, role: 'owner' },
  { project_id: 6, user_id: 3, role: 'editor' },
]

export const deliverables = [
  {
    id: 1,
    project_id: 1,
    title: 'Launch Trailer — Hero Cut',
    platform: 'youtube',
    publish_date: '2026-07-14',
    revision_round: 2,
  },
  {
    id: 2,
    project_id: 1,
    title: 'Teaser — 15s Cutdown',
    platform: 'tiktok',
    publish_date: '2026-06-20',
    revision_round: 0,
  },
  {
    id: 3,
    project_id: 2,
    title: 'Episode 1 — Studio Tour',
    platform: 'tiktok',
    publish_date: '2026-08-02',
    revision_round: 1,
  },
  {
    id: 4,
    project_id: 3,
    title: 'Hero Film — 60s',
    platform: 'youtube',
    publish_date: '2026-09-10',
    revision_round: 3,
  },
]

// stage order used to derive a deliverable's "current stage" from its tasks
// (schema.sql: not stored, computed) — see stores/projects.js getStage()
export const STAGE_ORDER = ['concept', 'script', 'shooting', 'editing', 'thumbnail', 'publishing']

export const tasks = [
  // Launch Trailer — Hero Cut (deliverable 1) — fully fleshed out, matches mockups
  { id: 101, deliverable_id: 1, assignee_id: 3, title: 'Write hook & opening outline', description: '', status: 'todo', stage: 'concept', due_date: '2026-06-02', position: 0 },
  { id: 102, deliverable_id: 1, assignee_id: 1, title: 'Lock shot list for studio day', description: '', status: 'todo', stage: 'shooting', due_date: '2026-06-05', position: 1 },
  { id: 103, deliverable_id: 1, assignee_id: 2, title: 'Source licensed b-roll music', description: '', status: 'todo', stage: 'editing', due_date: '2026-06-06', position: 2 },
  { id: 104, deliverable_id: 1, assignee_id: 1, title: 'Film studio interview segments', description: '', status: 'doing', stage: 'shooting', due_date: '2026-06-09', position: 0 },
  {
    id: 105,
    deliverable_id: 1,
    assignee_id: 2,
    title: 'Assemble rough cut v1',
    description: 'Cut the approved script against the studio footage and selected b-roll. Aim for a 90-second assembly — no colour or sound design yet. Flag any gaps where we still need pickups so we can slot them into the Jun 9 shoot.',
    status: 'doing',
    stage: 'editing',
    due_date: '2026-06-12',
    position: 1,
  },
  { id: 106, deliverable_id: 1, assignee_id: 3, title: 'Script approved by client', description: '', status: 'done', stage: 'script', due_date: '2026-06-01', position: 0 },
  { id: 107, deliverable_id: 1, assignee_id: 4, title: 'Location scout & permits', description: '', status: 'done', stage: 'concept', due_date: '2026-05-28', position: 1 },
  { id: 108, deliverable_id: 1, assignee_id: 1, title: 'Moodboard sign-off', description: '', status: 'done', stage: 'concept', due_date: '2026-05-26', position: 2 },

  // Teaser — 15s Cutdown (deliverable 2) — lighter
  { id: 201, deliverable_id: 2, assignee_id: 4, title: 'Pick 3 cutdown candidates', description: '', status: 'todo', stage: 'editing', due_date: '2026-06-14', position: 0 },
  { id: 202, deliverable_id: 2, assignee_id: 3, title: 'Captions pass', description: '', status: 'doing', stage: 'editing', due_date: '2026-06-16', position: 0 },
  { id: 203, deliverable_id: 2, assignee_id: 1, title: 'Concept approved', description: '', status: 'done', stage: 'concept', due_date: '2026-06-01', position: 0 },

  // Episode 1 — Studio Tour (deliverable 3)
  { id: 301, deliverable_id: 3, assignee_id: 5, title: 'Draft run-of-show', description: '', status: 'todo', stage: 'script', due_date: '2026-07-10', position: 0 },
  { id: 302, deliverable_id: 3, assignee_id: 4, title: 'Book studio slot', description: '', status: 'done', stage: 'concept', due_date: '2026-07-02', position: 0 },

  // Hero Film — 60s (deliverable 4)
  { id: 401, deliverable_id: 4, assignee_id: 6, title: 'Colour grade pass 2', description: '', status: 'doing', stage: 'editing', due_date: '2026-08-20', position: 0 },
  { id: 402, deliverable_id: 4, assignee_id: 1, title: 'Sound design', description: '', status: 'todo', stage: 'editing', due_date: '2026-08-25', position: 1 },
  { id: 403, deliverable_id: 4, assignee_id: 2, title: 'Thumbnail concepts', description: '', status: 'todo', stage: 'thumbnail', due_date: '2026-08-28', position: 2 },
]

export const comments = [
  { id: 1001, task_id: 105, author_id: 1, body: 'Great pacing on the open. The middle drags a touch around 0:40 — can we tighten the interview b-roll there?', created_at: '2026-06-08T09:14:00Z' },
  { id: 1002, task_id: 105, author_id: 2, body: 'On it — trimming ~6s and swapping the wide for the close-up. New pass up by EOD.', created_at: '2026-06-08T11:02:00Z' },
  { id: 1003, task_id: 105, author_id: 3, body: 'Client asked to hold the logo sting for the final frame — noting it for the thumbnail stage too.', created_at: '2026-06-08T14:41:00Z' },
]

export const assets = [
  { id: 1, deliverable_id: 1, uploaded_by: 3, label: 'Trailer script — final draft', url: '#', kind: 'script', version: 3, created_at: '2026-06-01T00:00:00Z' },
  { id: 2, deliverable_id: 1, uploaded_by: 1, label: 'Studio footage — select reel', url: '#', kind: 'raw_footage', version: 1, created_at: '2026-06-09T00:00:00Z' },
  { id: 3, deliverable_id: 1, uploaded_by: 2, label: 'Rough cut latest', url: '#', kind: 'edit', version: 1, created_at: '2026-06-12T00:00:00Z' },
  { id: 4, deliverable_id: 1, uploaded_by: 4, label: 'Thumbnail concepts', url: '#', kind: 'thumbnail', version: 2, created_at: '2026-06-10T00:00:00Z' },
]
