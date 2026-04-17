import { logger } from '@/utils/logger'

export interface Coord {
  lng: number
  lat: number
}

export interface GeocodeResult {
  coord: Coord | null
  error: string | null
}

const cache = new Map<string, GeocodeResult>()

async function openMeteoGeocode(place: string): Promise<GeocodeResult> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en`
    const res = await fetch(url)
    if (!res.ok) {
      return { coord: null, error: `Open-Meteo geocoding HTTP ${res.status}` }
    }
    const data = (await res.json()) as {
      results?: Array<{ latitude: number; longitude: number }>
    }
    const top = data.results?.[0]
    if (!top) {
      return { coord: null, error: null }
    }
    return { coord: { lng: top.longitude, lat: top.latitude }, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    return { coord: null, error: `Open-Meteo geocoding failed: ${msg}` }
  }
}

/**
 * Geocode a place name via Open-Meteo's free keyless API. Cached per-session.
 */
export async function geocode(place: string): Promise<Coord | null> {
  const result = await geocodeDetailed(place)
  return result.coord
}

/**
 * Generate progressively simpler candidate queries from a complex location
 * string so "Lisbon Alfama district, Portugal" still resolves to Lisbon if
 * the full string draws a blank.
 */
function buildCandidates(place: string): string[] {
  const trimmed = place.trim()
  if (!trimmed) return []
  const out: string[] = []
  const add = (s: string) => {
    const clean = s.trim()
    if (clean && !out.some((o) => o.toLowerCase() === clean.toLowerCase())) out.push(clean)
  }
  add(trimmed)
  trimmed.split(',').forEach(add)
  const firstWord = trimmed.split(/[\s,]/)[0]
  add(firstWord)
  return out
}

export async function geocodeDetailed(place: string): Promise<GeocodeResult> {
  const key = place.trim().toLowerCase()
  if (!key) return { coord: null, error: null }
  const cached = cache.get(key)
  if (cached) return cached

  const candidates = buildCandidates(place)
  let lastError: string | null = null

  for (const candidate of candidates) {
    const result = await openMeteoGeocode(candidate)
    if (result.coord) {
      cache.set(key, result)
      return result
    }
    if (result.error) lastError = result.error
  }

  const final: GeocodeResult = { coord: null, error: lastError }
  if (lastError) logger.warn('geocode failed for', place, lastError)
  cache.set(key, final)
  return final
}
