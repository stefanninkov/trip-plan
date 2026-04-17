import { logger } from './logger'

export interface RecentDestination {
  city: string
  country: string
  displayName: string
  usedAt: number
}

export type RecentKind = 'origin' | 'destination'

const KEY_BY_KIND: Record<RecentKind, string> = {
  origin: 'trip-plan.recent-origins',
  // Keep the legacy key for destinations so existing users don't lose history.
  destination: 'trip-plan.recent-destinations',
}
const MAX = 5

export function getRecentDestinations(kind: RecentKind = 'destination'): RecentDestination[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY_BY_KIND[kind])
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentDestination[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((r): r is RecentDestination => Boolean(r?.city && r?.displayName))
      .sort((a, b) => b.usedAt - a.usedAt)
      .slice(0, MAX)
  } catch (err) {
    logger.warn('Failed to read recent destinations', err)
    return []
  }
}

export function rememberDestination(
  dest: Omit<RecentDestination, 'usedAt'>,
  kind: RecentKind = 'destination'
): void {
  if (typeof localStorage === 'undefined') return
  if (!dest.city || !dest.displayName) return
  try {
    const current = getRecentDestinations(kind)
    const key = dest.displayName.toLowerCase()
    const deduped = current.filter((r) => r.displayName.toLowerCase() !== key)
    const next: RecentDestination[] = [
      { ...dest, usedAt: Date.now() },
      ...deduped,
    ].slice(0, MAX)
    localStorage.setItem(KEY_BY_KIND[kind], JSON.stringify(next))
  } catch (err) {
    logger.warn('Failed to save recent destination', err)
  }
}

export function removeRecentDestination(
  displayName: string,
  kind: RecentKind = 'destination'
): void {
  if (typeof localStorage === 'undefined') return
  try {
    const current = getRecentDestinations(kind)
    const key = displayName.toLowerCase()
    const next = current.filter((r) => r.displayName.toLowerCase() !== key)
    localStorage.setItem(KEY_BY_KIND[kind], JSON.stringify(next))
  } catch (err) {
    logger.warn('Failed to remove recent destination', err)
  }
}

export function clearRecentDestinations(kind: RecentKind = 'destination'): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(KEY_BY_KIND[kind])
  } catch {
    // ignore
  }
}
