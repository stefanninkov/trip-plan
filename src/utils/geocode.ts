import { logger } from '@/utils/logger'

export interface Coord {
  lng: number
  lat: number
}

const TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

const cache = new Map<string, Coord | null>()

/**
 * Geocode a place name via the Mapbox Geocoding API. Cached per-session so
 * a trip with 10 days hitting the same city doesn't repeat the lookup.
 */
export async function geocode(place: string): Promise<Coord | null> {
  const key = place.trim().toLowerCase()
  if (!key) return null
  if (cache.has(key)) return cache.get(key) ?? null
  if (!TOKEN) return null

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?access_token=${TOKEN}&limit=1&language=en`
    const res = await fetch(url)
    if (!res.ok) {
      cache.set(key, null)
      return null
    }
    const data = (await res.json()) as {
      features: Array<{ center?: [number, number] }>
    }
    const center = data.features?.[0]?.center
    if (!center) {
      cache.set(key, null)
      return null
    }
    const coord: Coord = { lng: center[0], lat: center[1] }
    cache.set(key, coord)
    return coord
  } catch (err) {
    logger.warn('geocode failed for', place, err)
    cache.set(key, null)
    return null
  }
}

export function hasMapboxToken(): boolean {
  return Boolean(TOKEN)
}
