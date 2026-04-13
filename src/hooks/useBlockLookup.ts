import { useState, useCallback } from 'react'
import { FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { logger } from '@/utils/logger'
import type { BlockPlaceInfo } from '@/types/trip-plan'
import type { PlaceResult } from '@/types/search'

interface LookupArgs {
  query: string
  location: string
}

/**
 * Hits the searchPlaces Cloud Function to fetch the first matching place
 * for a block title + day location. Returns a BlockPlaceInfo shape that
 * can be cached on the block.
 */
export function useBlockLookup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (args: LookupArgs): Promise<BlockPlaceInfo | null> => {
    if (!FUNCTIONS_BASE_URL) {
      setError('Backend not configured')
      return null
    }
    if (!args.query.trim() || !args.location.trim()) {
      setError('Missing query or location')
      return null
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${FUNCTIONS_BASE_URL}/searchPlaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { results: PlaceResult[] }
      const top = data.results[0]
      if (!top) return null
      return {
        address: top.address || null,
        phone: top.phone || null,
        website: top.website || null,
        hours: top.hours || null,
        rating: top.rating || null,
        priceLevel: top.priceLevel || null,
        mapsUrl: top.mapsUrl || null,
        thumbnailUrl: top.thumbnailUrl || null,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lookup failed'
      logger.error('useBlockLookup:', msg)
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, run }
}
