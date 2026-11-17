// The API sends DATE columns (due_date, publish_date) as 'YYYY-MM-DD'. `new Date('YYYY-MM-DD')`
// reads that as midnight UTC, which is the previous day in America/* time zones, so we build the
// date in local time instead. Timestamps (created_at...) are full ISO strings and parse fine.
export function parseDate(value) {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value)
}

// 'Nov 20' / 'Nov 20, 2026' (withYear), or null when there is no date
export function formatDay(value, { withYear = false } = {}) {
  const date = parseDate(value)
  if (!date) return null
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) })
}
