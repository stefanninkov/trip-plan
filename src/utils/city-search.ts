import { logger } from '@/utils/logger'

export interface CitySuggestion {
  city: string
  country: string
  displayName: string
}

interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  municipality?: string
  state?: string
  country?: string
}

interface NominatimResult {
  display_name: string
  address: NominatimAddress
  type: string
  place_id: number
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

/**
 * Free, keyless geocoding from OpenStreetMap.
 * Rate-limited — caller should debounce.
 */
export async function searchCities(query: string, signal?: AbortSignal): Promise<CitySuggestion[]> {
  if (query.trim().length < 2) return []

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '6',
    'accept-language': 'en',
  })

  try {
    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal,
    })
    if (!res.ok) return []
    const data = (await res.json()) as NominatimResult[]

    const seen = new Set<string>()
    const results: CitySuggestion[] = []

    for (const item of data) {
      const city =
        item.address.city ||
        item.address.town ||
        item.address.village ||
        item.address.municipality ||
        item.address.state ||
        item.display_name.split(',')[0]?.trim() ||
        ''
      const country = item.address.country || ''
      if (!city) continue

      const key = `${city.toLowerCase()}|${country.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)

      results.push({
        city,
        country,
        displayName: country ? `${city}, ${country}` : city,
      })
    }

    return results
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return []
    logger.warn('City search failed:', err)
    return []
  }
}
