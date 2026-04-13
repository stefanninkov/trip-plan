import { logger } from './logger'

const CACHE_KEY = 'trip-plan.rates'
const CACHE_TTL_MS = 1000 * 60 * 60 * 6 // 6h

interface CachedRates {
  base: string
  rates: Record<string, number>
  fetchedAt: number
}

let memoryCache: CachedRates | null = null

async function fetchRates(base: string): Promise<CachedRates | null> {
  try {
    // frankfurter.dev is an open ECB-backed API, no key required, CORS-friendly.
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}`)
    if (!res.ok) return null
    const data = (await res.json()) as { base: string; rates: Record<string, number> }
    return { base: data.base, rates: { ...data.rates, [data.base]: 1 }, fetchedAt: Date.now() }
  } catch (err) {
    logger.warn('Failed to fetch currency rates:', err)
    return null
  }
}

async function loadRates(base: string): Promise<CachedRates | null> {
  if (memoryCache && memoryCache.base === base && Date.now() - memoryCache.fetchedAt < CACHE_TTL_MS) {
    return memoryCache
  }
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as CachedRates
      if (parsed.base === base && Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
        memoryCache = parsed
        return parsed
      }
    }
  } catch {
    // ignore parse/storage errors
  }
  const fresh = await fetchRates(base)
  if (fresh) {
    memoryCache = fresh
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(fresh))
    } catch {
      // ignore storage quota
    }
  }
  return fresh
}

/**
 * Convert an amount from one currency to another.
 * Returns null if rates aren't available (no network on first load).
 */
export async function convert(
  amount: number,
  from: string,
  to: string
): Promise<number | null> {
  if (from === to) return amount
  const rates = await loadRates(from)
  if (!rates) return null
  const r = rates.rates[to]
  if (typeof r !== 'number') return null
  return amount * r
}

/**
 * Synchronous convert using the already-cached rates. Returns null if no
 * rates for that base have been loaded yet. Use this in render paths; kick
 * off a warmup via prefetchRates(base) once at trip load.
 */
export function convertSync(amount: number, from: string, to: string): number | null {
  if (from === to) return amount
  if (!memoryCache || memoryCache.base !== from) {
    // Try localStorage once more (sync) for SSR-free environments
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as CachedRates
        if (parsed.base === from && Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
          memoryCache = parsed
        }
      }
    } catch {
      // ignore
    }
  }
  if (!memoryCache || memoryCache.base !== from) return null
  const r = memoryCache.rates[to]
  if (typeof r !== 'number') return null
  return amount * r
}

export async function prefetchRates(base: string): Promise<void> {
  await loadRates(base)
}
