import { useCallback, useState } from 'react'
import { FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { logger } from '@/utils/logger'
import type { DestinationOverview } from '@/types/explore'

interface UseExploreState {
  loading: boolean
  error: string | null
  run: (query: string) => Promise<DestinationOverview | null>
}

// Small in-memory cache so toggling between history items is instant.
const cache = new Map<string, DestinationOverview>()

export function cacheOverview(key: string, overview: DestinationOverview) {
  cache.set(key.toLowerCase(), overview)
}

export function getCachedOverview(key: string): DestinationOverview | null {
  return cache.get(key.toLowerCase()) ?? null
}

export function useExplore(): UseExploreState {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (query: string): Promise<DestinationOverview | null> => {
    if (!FUNCTIONS_BASE_URL) {
      setError('Backend not configured')
      return null
    }
    const trimmed = query.trim()
    if (!trimmed) return null

    const cached = getCachedOverview(trimmed)
    if (cached) return cached

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${FUNCTIONS_BASE_URL}/exploreDestination`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { overview: DestinationOverview }
      cache.set(trimmed.toLowerCase(), data.overview)
      return data.overview
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Explore failed'
      logger.error('useExplore:', msg)
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, run }
}
