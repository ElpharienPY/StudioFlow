export const ROLES = ['owner', 'editor', 'viewer']
export const ROLE_RANK = { viewer: 1, editor: 2, owner: 3 }

export const HEALTH_STATUSES = ['kickoff', 'in_production', 'almost_done', 'on_track']
export const PLATFORMS = ['youtube', 'tiktok', 'instagram', 'client', 'other']
export const TASK_STATUSES = ['todo', 'doing', 'done']
export const STAGES = ['concept', 'script', 'shooting', 'editing', 'thumbnail', 'publishing']
export const ASSET_KINDS = ['script', 'raw_footage', 'edit', 'thumbnail', 'export']

// static strings only — safe to interpolate into SQL (FIELD(...) ordering)
export const SQL_STAGE_FIELD = STAGES.map((s) => `'${s}'`).join(',')
export const SQL_STATUS_FIELD = TASK_STATUSES.map((s) => `'${s}'`).join(',')
