import { logger } from './logger'
import type { DestinationOverview } from '@/types/explore'

export interface ExploreHistoryEntry {
  query: string
  name: string
  country: string
  kind: 'city' | 'country' | 'region'
  usedAt: number
}

const HISTORY_KEY = 'trip-plan.explore-history'
const RESULTS_KEY = 'trip-plan.explore-results'
const MAX_HISTORY = 12
// Cap stored overviews to avoid bloating localStorage (each is a few KB).
const MAX_RESULTS = 20

export function getExploreHistory(): ExploreHistoryEntry[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ExploreHistoryEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((r): r is ExploreHistoryEntry => Boolean(r?.query && r?.name))
      .sort((a, b) => b.usedAt - a.usedAt)
      .slice(0, MAX_HISTORY)
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
    ].slice(0, MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch (err) {
    logger.warn('Failed to save explore history', err)
  }
}

/**
 * Load every stored overview keyed by its original query (lowercased). Used
 * to seed the in-memory explore cache on app startup so clicking a history
 * chip surfaces the result instantly without hitting the Cloud Function.
 */
export function loadStoredResults(): Record<string, DestinationOverview> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(RESULTS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, DestinationOverview>
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch (err) {
    logger.warn('Failed to read stored explore results', err)
    return {}
  }
}

export function saveExploreResult(query: string, overview: DestinationOverview): void {
  if (typeof localStorage === 'undefined') return
  const key = query.trim().toLowerCase()
  if (!key) return
  try {
    const current = loadStoredResults()
    // Remove this key if present, re-insert at end so LRU works.
    delete current[key]
    const entries = Object.entries(current)
    // Drop oldest entries if we're over the cap.
    const trimmed = entries.slice(Math.max(0, entries.length - (MAX_RESULTS - 1)))
    trimmed.push([key, overview])
    localStorage.setItem(RESULTS_KEY, JSON.stringify(Object.fromEntries(trimmed)))
  } catch (err) {
    logger.warn('Failed to save explore result', err)
  }
}

export function getStoredResult(query: string): DestinationOverview | null {
  const key = query.trim().toLowerCase()
  if (!key) return null
  const all = loadStoredResults()
  return all[key] ?? null
}

export function clearExploreHistory(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(HISTORY_KEY)
    localStorage.removeItem(RESULTS_KEY)
  } catch {
    // ignore
  }
}
