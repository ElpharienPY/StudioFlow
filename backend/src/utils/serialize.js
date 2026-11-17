// The DB has no avatar colour column, so derive a stable one from the user id
// (same palette as frontend/src/stores/auth.js).
const PALETTE = ['#6366f1', '#10b981', '#a855f7', '#ec4899', '#06b6d4', '#f59e0b']

export function initialsOf(fullName) {
  return fullName
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

// never includes password_hash — build user payloads through this function only
export function publicUser(row) {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    initials: initialsOf(row.full_name),
    color: PALETTE[(row.id - 1) % PALETTE.length],
  }
}
