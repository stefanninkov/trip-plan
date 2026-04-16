import { useState, useCallback } from 'react'
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import i18n from 'i18next'
import { db, FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { useAuthStore } from '@/store/auth-store'
import { logger } from '@/utils/logger'
import { buildSkeletonPlan } from '@/utils/skeleton-plan'
import { buildTripFromSearch, type SearchPlanProgress } from '@/utils/search-plan'
import { sanitizeForFirestore } from '@/utils/sanitize'
import type { TripInputs } from '@/types/wizard'
import type { TripPlan } from '@/types/trip-plan'

interface GenerateResult {
  tripId: string
  plan: TripPlan
}

interface UseGenerateTripState {
  isGenerating: boolean
  error: string | null
  /** Progress hint set by the search-based builder (null when not running). */
  searchProgress: SearchPlanProgress | null
  generate: (inputs: TripInputs) => Promise<GenerateResult | null>
  /** Build a trip from live web-search data (hotels, places, flights). */
  generateFromSearch: (inputs: TripInputs) => Promise<GenerateResult | null>
  createBlank: (inputs: TripInputs) => Promise<GenerateResult | null>
  clearError: () => void
}

async function createTripDoc(userId: string, inputs: TripInputs) {
  return addDoc(collection(db, 'trips'), {
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    inputs: sanitizeForFirestore(inputs),
    plan: null,
    status: 'generating',
    shared: false,
    shareToken: null,
  })
}

export function useGenerateTrip(): UseGenerateTripState {
  const user = useAuthStore((s) => s.user)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchProgress, setSearchProgress] = useState<SearchPlanProgress | null>(null)

  const generate = useCallback(
    async (inputs: TripInputs): Promise<GenerateResult | null> => {
      if (!user) {
        setError('Not signed in')
        return null
      }
      if (!FUNCTIONS_BASE_URL) {
        setError('Backend not configured (VITE_FUNCTIONS_BASE_URL)')
        return null
      }

      setError(null)
      setIsGenerating(true)

      let tripRef: Awaited<ReturnType<typeof createTripDoc>> | null = null
      // Client-side timeout so the UI never hangs indefinitely even if the
      // Cloud Function never responds.
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 180_000)
      try {
        tripRef = await createTripDoc(user.uid, inputs)
        const res = await fetch(`${FUNCTIONS_BASE_URL}/generateTrip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs,
            language: (i18n.resolvedLanguage ?? 'en').startsWith('sr') ? 'sr' : 'en',
          }),
          signal: controller.signal,
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string
            truncated?: boolean
          }
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }
        const { plan } = (await res.json()) as { plan: TripPlan }
        await updateDoc(doc(db, 'trips', tripRef.id), {
          plan: sanitizeForFirestore(plan),
          status: 'complete',
          updatedAt: serverTimestamp(),
        })
        return { tripId: tripRef.id, plan }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.name === 'AbortError'
              ? 'Generation timed out after 3 minutes. Try a shorter trip or try again.'
              : err.message
            : 'Generation failed'
        logger.error('useGenerateTrip:', msg)
        setError(msg)
        if (tripRef) {
          await updateDoc(doc(db, 'trips', tripRef.id), {
            status: 'error',
            updatedAt: serverTimestamp(),
          }).catch(() => undefined)
        }
        return null
      } finally {
        window.clearTimeout(timeoutId)
        setIsGenerating(false)
      }
    },
    [user]
  )

  const generateFromSearch = useCallback(
    async (inputs: TripInputs): Promise<GenerateResult | null> => {
      if (!user) {
        setError('Not signed in')
        return null
      }
      if (!FUNCTIONS_BASE_URL) {
        setError('Backend not configured (VITE_FUNCTIONS_BASE_URL)')
        return null
      }
      setError(null)
      setIsGenerating(true)
      setSearchProgress({ label: 'Starting search', pct: 2 })
      let tripRef: Awaited<ReturnType<typeof createTripDoc>> | null = null
      try {
        tripRef = await createTripDoc(user.uid, inputs)
        const plan = await buildTripFromSearch(inputs, (p) => setSearchProgress(p))
        await updateDoc(doc(db, 'trips', tripRef.id), {
          plan: sanitizeForFirestore(plan),
          status: 'complete',
          updatedAt: serverTimestamp(),
        })
        return { tripId: tripRef.id, plan }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Search-based build failed'
        logger.error('generateFromSearch:', msg)
        setError(msg)
        if (tripRef) {
          await updateDoc(doc(db, 'trips', tripRef.id), {
            status: 'error',
            updatedAt: serverTimestamp(),
          }).catch(() => undefined)
        }
        return null
      } finally {
        setIsGenerating(false)
        setSearchProgress(null)
      }
    },
    [user]
  )

  const createBlank = useCallback(
    async (inputs: TripInputs): Promise<GenerateResult | null> => {
      if (!user) {
        setError('Not signed in')
        return null
      }
      setError(null)
      setIsGenerating(true)
      try {
        const plan = buildSkeletonPlan(inputs)
        const tripRef = await createTripDoc(user.uid, inputs)
        await updateDoc(doc(db, 'trips', tripRef.id), {
          plan: sanitizeForFirestore(plan),
          status: 'complete',
          updatedAt: serverTimestamp(),
        })
        return { tripId: tripRef.id, plan }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create blank trip'
        logger.error('createBlank:', msg)
        setError(msg)
        return null
      } finally {
        setIsGenerating(false)
      }
    },
    [user]
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    isGenerating,
    error,
    searchProgress,
    generate,
    generateFromSearch,
    createBlank,
    clearError,
  }
}
