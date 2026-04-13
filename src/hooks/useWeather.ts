import { useEffect, useState } from 'react'
import { logger } from '@/utils/logger'

export interface DayWeather {
  highC: number
  lowC: number
  code: number
  label: string
  precipProbability: number
}

interface OpenMeteoResponse {
  daily?: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
    precipitation_probability_max: number[]
  }
}

interface OpenMeteoGeocode {
  results?: Array<{ latitude: number; longitude: number }>
}

const geoCache = new Map<string, { lat: number; lng: number } | null>()

async function openMeteoGeocode(name: string): Promise<{ lat: number; lng: number } | null> {
  const key = name.toLowerCase().trim()
  if (!key) return null
  if (geoCache.has(key)) return geoCache.get(key) ?? null
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en`
    const res = await fetch(url)
    if (!res.ok) {
      geoCache.set(key, null)
      return null
    }
    const data = (await res.json()) as OpenMeteoGeocode
    const top = data.results?.[0]
    if (!top) {
      geoCache.set(key, null)
      return null
    }
    const coord = { lat: top.latitude, lng: top.longitude }
    geoCache.set(key, coord)
    return coord
  } catch (err) {
    logger.warn('Open-Meteo geocode failed for', name, err)
    geoCache.set(key, null)
    return null
  }
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

export function useWeather(location: string, dateIso: string): DayWeather | null | 'loading' {
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
        const url =
          'https://api.open-meteo.com/v1/forecast?latitude=' +
          coord.lat +
          '&longitude=' +
          coord.lng +
          '&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max' +
          '&start_date=' +
          dateIso +
          '&end_date=' +
          dateIso +
          '&timezone=auto'
        const res = await fetch(url)
        if (!res.ok) {
          cache.set(key, null)
          if (!cancelled) setState(null)
          return
        }
        const data = (await res.json()) as OpenMeteoResponse
        const daily = data.daily
        if (!daily || daily.time.length === 0) {
          cache.set(key, null)
          if (!cancelled) setState(null)
          return
        }
        const weather: DayWeather = {
          highC: daily.temperature_2m_max[0],
          lowC: daily.temperature_2m_min[0],
          code: daily.weather_code[0],
          label: CODE_LABELS[daily.weather_code[0]] ?? 'Variable',
          precipProbability: daily.precipitation_probability_max[0] ?? 0,
        }
        cache.set(key, weather)
        if (!cancelled) setState(weather)
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
