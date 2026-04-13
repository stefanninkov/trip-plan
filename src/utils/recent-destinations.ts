import { logger } from './logger'

export interface RecentDestination {
  city: string
  country: string
  displayName: string
  usedAt: number
}

const KEY = 'trip-plan.recent-destinations'
const MAX = 5

export function getRecentDestinations(): RecentDestination[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
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

export function rememberDestination(dest: Omit<RecentDestination, 'usedAt'>): void {
  if (typeof localStorage === 'undefined') return
  if (!dest.city || !dest.displayName) return
  try {
    const current = getRecentDestinations()
    const key = dest.displayName.toLowerCase()
    const deduped = current.filter((r) => r.displayName.toLowerCase() !== key)
    const next: RecentDestination[] = [
      { ...dest, usedAt: Date.now() },
      ...deduped,
    ].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch (err) {
    logger.warn('Failed to save recent destination', err)
  }
}

export function clearRecentDestinations(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
