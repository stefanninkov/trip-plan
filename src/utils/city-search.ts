import { logger } from '@/utils/logger'

export interface CitySuggestion {
  city: string
  country: string
  displayName: string
  /** Optional admin region for disambiguating (e.g. "Halkidiki, Greece"). */
  admin?: string
}

// ---- Open-Meteo (primary): covers small towns / villages well ----
interface MeteoGeoResult {
  name: string
  country?: string
  admin1?: string
  admin2?: string
  admin3?: string
  country_code?: string
  latitude: number
  longitude: number
  feature_code?: string
  population?: number
}

interface MeteoGeoResponse {
  results?: MeteoGeoResult[]
}

const METEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'

async function searchOpenMeteo(
  query: string,
  signal?: AbortSignal
): Promise<CitySuggestion[]> {
  const params = new URLSearchParams({
    name: query,
    count: '10',
    language: 'en',
    format: 'json',
  })
  const res = await fetch(`${METEO_URL}?${params.toString()}`, { signal })
  if (!res.ok) return []
  const data = (await res.json()) as MeteoGeoResponse
  const results: CitySuggestion[] = []
  const seen = new Set<string>()
  for (const r of data.results ?? []) {
    if (!r.name) continue
    const country = r.country ?? ''
    const admin = [r.admin1, r.admin2].filter(Boolean).join(', ')
    const key = `${r.name.toLowerCase()}|${country.toLowerCase()}|${admin.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    const label = [r.name, admin, country].filter(Boolean).join(', ')
    results.push({
      city: r.name,
      country,
      admin,
      displayName: label,
    })
  }
  return results
}

// ---- Nominatim (fallback) ----
interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  hamlet?: string
  suburb?: string
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

async function searchNominatim(
  query: string,
  signal?: AbortSignal
): Promise<CitySuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '8',
    'accept-language': 'en',
  })
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    { headers: { Accept: 'application/json' }, signal }
  )
  if (!res.ok) return []
  const data = (await res.json()) as NominatimResult[]
  const seen = new Set<string>()
  const results: CitySuggestion[] = []
  for (const item of data) {
    const city =
      item.address.city ||
      item.address.town ||
      item.address.village ||
      item.address.hamlet ||
      item.address.municipality ||
      item.address.suburb ||
      item.address.state ||
      item.display_name.split(',')[0]?.trim() ||
      ''
    const country = item.address.country ?? ''
    if (!city) continue
    const admin = item.address.state ?? ''
    const key = `${city.toLowerCase()}|${country.toLowerCase()}|${admin.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    results.push({
      city,
      country,
      admin,
      displayName: [city, admin, country].filter(Boolean).join(', '),
    })
  }
  return results
}

/**
 * City / town / village autocomplete. Tries Open-Meteo first (best
 * coverage for small towns — e.g. Pefkochori, Vrhovine), then
 * Nominatim for anything Open-Meteo missed. Results are merged and
 * de-duped by (city + country + admin) so "Rome, Italy" and
 * "Rome, Lazio, Italy" don't both appear.
 */
export async function searchCities(
  query: string,
  signal?: AbortSignal
): Promise<CitySuggestion[]> {
  if (query.trim().length < 2) return []

  try {
    const [primary, fallback] = await Promise.allSettled([
      searchOpenMeteo(query, signal),
      searchNominatim(query, signal),
    ])

    const out: CitySuggestion[] = []
    const seen = new Set<string>()
    const push = (r: CitySuggestion) => {
      const key = `${r.city.toLowerCase()}|${r.country.toLowerCase()}|${(r.admin ?? '').toLowerCase()}`
      if (seen.has(key)) return
      seen.add(key)
      out.push(r)
    }
    if (primary.status === 'fulfilled') primary.value.forEach(push)
    if (fallback.status === 'fulfilled') fallback.value.forEach(push)
    return out.slice(0, 10)
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return []
    logger.warn('City search failed:', err)
    return []
  }
}
