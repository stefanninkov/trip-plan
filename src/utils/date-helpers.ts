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
