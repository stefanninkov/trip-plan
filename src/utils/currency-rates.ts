import { logger } from './logger'

const CACHE_KEY = 'trip-plan.rates'
const CACHE_TTL_MS = 1000 * 60 * 60 * 6 // 6h

/**
 * Approximate EUR conversion rates for currencies that frankfurter.dev
 * doesn't cover (or for offline fallback). "1 EUR = FALLBACK_EUR_RATES[x]"
 * units of x. Tuned for mid-2025 — close enough for "Euro primary"
 * display; the UI labels the value with ≈ so users know it's approximate.
 */
const FALLBACK_EUR_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.84,
  CHF: 0.96,
  RSD: 117,
  JPY: 165,
  CAD: 1.48,
  AUD: 1.64,
  TRY: 38,
  THB: 38,
  AED: 4.0,
  SEK: 11.4,
  NOK: 12.4,
  DKK: 7.46,
  CZK: 25.2,
  PLN: 4.3,
  HUF: 395,
  MXN: 21.8,
  BRL: 6.0,
  INR: 92,
  CNY: 7.85,
  KRW: 1480,
  ZAR: 20,
  SGD: 1.45,
  HKD: 8.4,
}

/**
 * Synchronous fallback conversion using the hardcoded EUR-anchored rates.
 * Returns null if either currency isn't in the table.
 */
function fallbackConvert(amount: number, from: string, to: string): number | null {
  if (from === to) return amount
  const fromRate = FALLBACK_EUR_RATES[from.toUpperCase()]
  const toRate = FALLBACK_EUR_RATES[to.toUpperCase()]
  if (typeof fromRate !== 'number' || typeof toRate !== 'number') return null
  // amount in `from` -> EUR -> `to`
  const inEur = amount / fromRate
  return inEur * toRate
}

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
  if (rates) {
    const r = rates.rates[to]
    if (typeof r === 'number') return amount * r
  }
  return fallbackConvert(amount, from, to)
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
  if (memoryCache && memoryCache.base === from) {
    const r = memoryCache.rates[to]
    if (typeof r === 'number') return amount * r
  }
  // Live rates weren't available (either not yet fetched, or frankfurter
  // doesn't cover this currency — e.g. RSD). Fall back to the hardcoded
  // EUR-anchored rates so we can still show an approximate Euro value.
  return fallbackConvert(amount, from, to)
}

export async function prefetchRates(base: string): Promise<void> {
  await loadRates(base)
}
