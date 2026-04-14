export function formatDate(isoDate: string): string {
  // Parse "YYYY-MM-DD" explicitly as a local date so Jun 7 never becomes
  // Jun 6 in a positive-UTC timezone (new Date('2026-06-07') is UTC
  // midnight, which is still Jun 6 in Istanbul).
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate)
  const date = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(isoDate)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateRange(startIso: string, endIso: string): string {
  return `${formatDate(startIso)} – ${formatDate(endIso)}`
}

export function daysBetween(startIso: string, endIso: string): number {
  // Parse local so DST or timezone offsets don't knock the result off.
  const parse = (iso: string): number => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
    if (!m) return new Date(iso).getTime()
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime()
  }
  return Math.max(0, Math.round((parse(endIso) - parse(startIso)) / (1000 * 60 * 60 * 24)))
}

export function toIsoDate(date: Date): string {
  // Format using the traveller's LOCAL year/month/day. toISOString() would
  // convert to UTC and return the previous (or next) calendar day in
  // non-UTC timezones — the root cause of the DateRangePicker off-by-one.
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Today's date in YYYY-MM-DD form, in the traveler's local timezone. */
export function todayIso(): string {
  return toIsoDate(new Date())
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
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate)
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(isoDate)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}
