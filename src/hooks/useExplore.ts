import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { logger } from '@/utils/logger'
import { rememberExplore } from '@/utils/explore-history'
import type { DestinationOverview } from '@/types/explore'

/**
 * Explore state is held in a module-level Zustand store (not in component
 * state) so that switching tabs / navigating away does NOT cancel the
 * in-flight request. When the user returns to the Explore page, whatever
 * state the store has is what they see.
 */
interface ExploreStoreState {
  /** The query currently being processed, if any. */
  currentQuery: string | null
  loading: boolean
  error: string | null
  /** The most recently successful result. */
  overview: DestinationOverview | null
  /** Per-query cache so history clicks are instant. */
  cache: Record<string, DestinationOverview>
  run: (query: string) => Promise<DestinationOverview | null>
  clearError: () => void
  reset: () => void
}

const useExploreStore = create<ExploreStoreState>((set, get) => ({
  currentQuery: null,
  loading: false,
  error: null,
  overview: null,
  cache: {},

  run: async (query: string): Promise<DestinationOverview | null> => {
    const trimmed = query.trim()
    if (!trimmed) return null
    const key = trimmed.toLowerCase()

    // Instant return from cache, and set it as the visible overview.
    const cached = get().cache[key]
    if (cached) {
      set({ overview: cached, currentQuery: trimmed, loading: false, error: null })
      return cached
    }

    if (!FUNCTIONS_BASE_URL) {
      set({ error: 'Backend not configured' })
      return null
    }

    set({ loading: true, error: null, currentQuery: trimmed, overview: null })

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

      // If another query has been kicked off in the meantime, don't clobber
      // the newer state with our old result.
      if (get().currentQuery !== trimmed) return data.overview

      rememberExplore({
        query: trimmed,
        name: data.overview.name,
        country: data.overview.country,
        kind: data.overview.kind,
      })
      set((s) => ({
        overview: data.overview,
        loading: false,
        cache: { ...s.cache, [key]: data.overview },
      }))
      return data.overview
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Explore failed'
      logger.error('useExplore:', msg)
      if (get().currentQuery === trimmed) {
        set({ error: msg, loading: false })
      }
      return null
    }
  },

  clearError: () => set({ error: null }),
  reset: () =>
    set({ currentQuery: null, loading: false, error: null, overview: null }),
}))

// Legacy exports kept for any external callers.
export function cacheOverview(key: string, overview: DestinationOverview) {
  useExploreStore.setState((s) => ({ cache: { ...s.cache, [key.toLowerCase()]: overview } }))
}

export function getCachedOverview(key: string): DestinationOverview | null {
  return useExploreStore.getState().cache[key.toLowerCase()] ?? null
}

export interface UseExploreApi {
  loading: boolean
  error: string | null
  overview: DestinationOverview | null
  currentQuery: string | null
  run: (query: string) => Promise<DestinationOverview | null>
  clearError: () => void
  reset: () => void
}

export function useExplore(): UseExploreApi {
  const loading = useExploreStore((s) => s.loading)
  const error = useExploreStore((s) => s.error)
  const overview = useExploreStore((s) => s.overview)
  const currentQuery = useExploreStore((s) => s.currentQuery)
  // These are stable function references from Zustand, safe for deps.
  const [run] = useState(() => useExploreStore.getState().run)
  const [clearError] = useState(() => useExploreStore.getState().clearError)
  const [reset] = useState(() => useExploreStore.getState().reset)

  // Subscribe so React re-renders if other callers mutate these functions
  // (they won't in practice, but this keeps hook semantics tidy).
  useEffect(() => {
    return useExploreStore.subscribe(() => {})
  }, [])

  return { loading, error, overview, currentQuery, run, clearError, reset }
}
