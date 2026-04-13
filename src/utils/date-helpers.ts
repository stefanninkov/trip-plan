export function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateRange(startIso: string, endIso: string): string {
  return `${formatDate(startIso)} \u2013 ${formatDate(endIso)}`
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)))
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Today's date in YYYY-MM-DD form, in the traveler's local timezone. */
export function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 'past' | 'today' | 'future' for a given YYYY-MM-DD date. */
export function relativeDay(isoDate: string): 'past' | 'today' | 'future' {
  const today = todayIso()
  if (isoDate < today) return 'past'
  if (isoDate > today) return 'future'
  return 'today'
}

/** Add a number of days to an ISO date (can be negative). */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}
