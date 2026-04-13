import { useState, useCallback } from 'react'
import { FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { logger } from '@/utils/logger'
import type {
  FlightResult,
  HotelResult,
  PlaceResult,
  WebSearchResult,
} from '@/types/search'

type Endpoint = 'searchFlights' | 'searchHotels' | 'searchPlaces' | 'searchWeb'

async function post<TReq, TRes>(endpoint: Endpoint, body: TReq): Promise<TRes> {
  if (!FUNCTIONS_BASE_URL) throw new Error('Backend not configured')
  const res = await fetch(`${FUNCTIONS_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<TRes>
}

export interface FlightSearchParams {
  origin: string
  destination: string
  date: string
  returnDate?: string
  travelers?: number
}

export interface HotelSearchParams {
  location: string
  checkIn: string
  checkOut: string
  guests?: number
  currency?: string
}

export interface PlaceSearchParams {
  query: string
  location?: string
}

export interface WebSearchParams {
  query: string
}

export function useSearch<TParams, TResult>(endpoint: Endpoint) {
  const [results, setResults] = useState<TResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (params: TParams) => {
      setError(null)
      setLoading(true)
      try {
        const data = await post<TParams, { results: TResult[] }>(endpoint, params)
        setResults(data.results)
        return data.results
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Search failed'
        logger.error(endpoint, msg)
        setError(msg)
        return []
      } finally {
        setLoading(false)
      }
    },
    [endpoint]
  )

  return { results, loading, error, run, clear: () => setResults([]) }
}

export const useFlightSearch = () =>
  useSearch<FlightSearchParams, FlightResult>('searchFlights')
export const useHotelSearch = () => useSearch<HotelSearchParams, HotelResult>('searchHotels')
export const usePlaceSearch = () => useSearch<PlaceSearchParams, PlaceResult>('searchPlaces')
export const useWebSearch = () => useSearch<WebSearchParams, WebSearchResult>('searchWeb')
