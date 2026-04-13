import { logger } from './logger'

export interface ExploreHistoryEntry {
  query: string
  name: string
  country: string
  kind: 'city' | 'country' | 'region'
  usedAt: number
}

const KEY = 'trip-plan.explore-history'
const MAX = 12

export function getExploreHistory(): ExploreHistoryEntry[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ExploreHistoryEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((r): r is ExploreHistoryEntry => Boolean(r?.query && r?.name))
      .sort((a, b) => b.usedAt - a.usedAt)
      .slice(0, MAX)
  } catch (err) {
    logger.warn('Failed to read explore history', err)
    return []
  }
}

export function rememberExplore(entry: Omit<ExploreHistoryEntry, 'usedAt'>): void {
  if (typeof localStorage === 'undefined') return
  if (!entry.query || !entry.name) return
  try {
    const current = getExploreHistory()
    const key = entry.query.toLowerCase()
    const deduped = current.filter((r) => r.query.toLowerCase() !== key)
    const next: ExploreHistoryEntry[] = [
      { ...entry, usedAt: Date.now() },
      ...deduped,
    ].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch (err) {
    logger.warn('Failed to save explore history', err)
  }
}

export function clearExploreHistory(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
