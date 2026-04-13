import { useEffect, useState } from 'react'
import { logger } from '@/utils/logger'
import { todayIso } from '@/utils/date-helpers'

export interface DayWeather {
  highC: number
  lowC: number
  code: number
  label: string
  precipProbability: number
  /** 'forecast' for real near-term data, 'historical' for same-month last-year */
  source: 'forecast' | 'historical'
}

interface OpenMeteoForecastResponse {
  daily?: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
    precipitation_probability_max: number[]
  }
}

interface OpenMeteoArchiveResponse {
  daily?: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
    precipitation_sum?: number[]
  }
}

interface OpenMeteoGeocode {
  results?: Array<{ latitude: number; longitude: number }>
}

const geoCache = new Map<string, { lat: number; lng: number } | null>()

/**
 * Geocode a place name via Open-Meteo. If the full string fails (e.g.
 * "Lisbon Alfama District, Portugal"), progressively simplify by dropping
 * qualifiers so we still get a city hit.
 */
async function openMeteoGeocode(
  name: string
): Promise<{ lat: number; lng: number } | null> {
  const trimmed = name.trim()
  if (!trimmed) return null
  const cacheKey = trimmed.toLowerCase()
  if (geoCache.has(cacheKey)) return geoCache.get(cacheKey) ?? null

  // Build candidates: full string, then each comma-split part, then the
  // first "word" alone. De-duped, in order.
  const candidates: string[] = []
  const add = (s: string) => {
    const clean = s.trim()
    if (clean && !candidates.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      candidates.push(clean)
    }
  }
  add(trimmed)
  trimmed.split(',').forEach((part) => add(part))
  const first = trimmed.split(/[\s,]/)[0]
  add(first)

  for (const candidate of candidates) {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidate)}&count=1&language=en`
      const res = await fetch(url)
      if (!res.ok) continue
      const data = (await res.json()) as OpenMeteoGeocode
      const top = data.results?.[0]
      if (!top) continue
      const coord = { lat: top.latitude, lng: top.longitude }
      geoCache.set(cacheKey, coord)
      return coord
    } catch (err) {
      logger.warn('Open-Meteo geocode failed for', candidate, err)
    }
  }
  geoCache.set(cacheKey, null)
  return null
}

// Open-Meteo WMO weather codes, short labels
const CODE_LABELS: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers',
  81: 'Showers',
  82: 'Heavy showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm w/ hail',
  99: 'Severe thunderstorm',
}

const cache = new Map<string, DayWeather | null>()

/**
 * Return a YYYY-MM-DD for the same calendar day one year earlier. This is
 * used as a reasonable "typical weather for this time of year" proxy when
 * the target date is beyond the 16-day forecast window.
 */
function lastYearIso(dateIso: string): string {
  const d = new Date(dateIso)
  d.setFullYear(d.getFullYear() - 1)
  return d.toISOString().slice(0, 10)
}

function daysFromToday(dateIso: string): number {
  const today = new Date(todayIso()).getTime()
  const target = new Date(dateIso).getTime()
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

async function fetchForecast(
  coord: { lat: number; lng: number },
  dateIso: string
): Promise<DayWeather | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
    `&start_date=${dateIso}&end_date=${dateIso}&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as OpenMeteoForecastResponse
  const daily = data.daily
  if (!daily || daily.time.length === 0) return null
  return {
    highC: daily.temperature_2m_max[0],
    lowC: daily.temperature_2m_min[0],
    code: daily.weather_code[0],
    label: CODE_LABELS[daily.weather_code[0]] ?? 'Variable',
    precipProbability: daily.precipitation_probability_max[0] ?? 0,
    source: 'forecast',
  }
}

async function fetchArchive(
  coord: { lat: number; lng: number },
  dateIso: string
): Promise<DayWeather | null> {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${coord.lat}&longitude=${coord.lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum` +
    `&start_date=${dateIso}&end_date=${dateIso}&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as OpenMeteoArchiveResponse
  const daily = data.daily
  if (!daily || daily.time.length === 0) return null
  // Convert precipitation_sum (mm) to a rough probability-like indicator.
  const precip = daily.precipitation_sum?.[0] ?? 0
  return {
    highC: daily.temperature_2m_max[0],
    lowC: daily.temperature_2m_min[0],
    code: daily.weather_code[0],
    label: CODE_LABELS[daily.weather_code[0]] ?? 'Variable',
    precipProbability: precip > 5 ? 70 : precip > 1 ? 40 : 10,
    source: 'historical',
  }
}

export function useWeather(
  location: string,
  dateIso: string
): DayWeather | null | 'loading' {
  const key = `${location.toLowerCase()}|${dateIso}`
  const [state, setState] = useState<DayWeather | null | 'loading'>(
    cache.has(key) ? cache.get(key) ?? null : 'loading'
  )

  useEffect(() => {
    if (cache.has(key)) {
      setState(cache.get(key) ?? null)
      return
    }
    let cancelled = false
    setState('loading')
    const run = async () => {
      try {
        const coord = await openMeteoGeocode(location)
        if (cancelled) return
        if (!coord) {
          cache.set(key, null)
          setState(null)
          return
        }

        const daysOut = daysFromToday(dateIso)
        let weather: DayWeather | null = null

        // Forecast API reliably covers ~16 days ahead. Beyond that window
        // fall back to historical data (same date last year) which gives a
        // reasonable "what to expect this time of year" answer.
        if (daysOut >= -7 && daysOut <= 14) {
          weather = await fetchForecast(coord, dateIso)
        }
        if (!weather) {
          weather = await fetchArchive(coord, lastYearIso(dateIso))
        }

        if (cancelled) return
        cache.set(key, weather)
        setState(weather)
      } catch (err) {
        logger.warn('weather fetch failed', err)
        cache.set(key, null)
        if (!cancelled) setState(null)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [key, location, dateIso])

  return state
}
