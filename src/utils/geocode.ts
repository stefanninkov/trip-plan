import { logger } from '@/utils/logger'

export interface Coord {
  lng: number
  lat: number
}

export interface GeocodeResult {
  coord: Coord | null
  error: string | null
  /** Which provider successfully resolved the coord, if any. */
  provider?: 'mapbox' | 'open-meteo'
}

const TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

const cache = new Map<string, GeocodeResult>()

async function mapboxGeocode(place: string): Promise<GeocodeResult> {
  if (!TOKEN) {
    return { coord: null, error: 'VITE_MAPBOX_TOKEN not set' }
  }
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?access_token=${TOKEN}&limit=1&language=en`
    const res = await fetch(url)
    if (!res.ok) {
      if (res.status === 401) {
        return { coord: null, error: 'Mapbox token is invalid (401 Unauthorized)' }
      }
      if (res.status === 403) {
        return {
          coord: null,
          error:
            'Mapbox token is not authorized for the geocoding API (403). Check URL restrictions on the token.',
        }
      }
      if (res.status === 429) {
        return { coord: null, error: 'Mapbox rate limit exceeded (429)' }
      }
      return { coord: null, error: `Mapbox geocoding HTTP ${res.status}` }
    }
    const data = (await res.json()) as {
      features: Array<{ center?: [number, number] }>
    }
    const center = data.features?.[0]?.center
    if (!center) {
      return { coord: null, error: null }
    }
    return { coord: { lng: center[0], lat: center[1] }, error: null, provider: 'mapbox' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    return { coord: null, error: `Mapbox geocoding failed: ${msg}` }
  }
}

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
    return {
      coord: { lng: top.longitude, lat: top.latitude },
      error: null,
      provider: 'open-meteo',
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    return { coord: null, error: `Open-Meteo geocoding failed: ${msg}` }
  }
}

/**
 * Geocode a place name. Tries Mapbox first (richer results), then falls back to
 * Open-Meteo's free keyless API so the map works even when VITE_MAPBOX_TOKEN
 * is missing or misconfigured. Cached per-session.
 */
export async function geocode(place: string): Promise<Coord | null> {
  const result = await geocodeDetailed(place)
  return result.coord
}

/**
 * Generate progressively simpler candidate queries from a complex location
 * string so "Lisbon Alfama district, Portugal" still resolves to Lisbon if
 * the full string draws a blank. Order: full, each comma part, first word.
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
    // Try Mapbox first when a token is present.
    let result: GeocodeResult = TOKEN
      ? await mapboxGeocode(candidate)
      : { coord: null, error: 'No Mapbox token — using Open-Meteo fallback' }

    if (!result.coord) {
      const fallback = await openMeteoGeocode(candidate)
      if (fallback.coord) {
        result = fallback
      } else if (!result.error && fallback.error) {
        result = fallback
      }
    }
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

export function hasMapboxToken(): boolean {
  return Boolean(TOKEN)
}
