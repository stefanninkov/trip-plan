import { useState, useCallback } from 'react'
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db, FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { useAuthStore } from '@/store/auth-store'
import { logger } from '@/utils/logger'
import { buildSkeletonPlan } from '@/utils/skeleton-plan'
import type { TripInputs } from '@/types/wizard'
import type { TripPlan } from '@/types/trip-plan'

interface GenerateResult {
  tripId: string
  plan: TripPlan
}

interface UseGenerateTripState {
  isGenerating: boolean
  error: string | null
  generate: (inputs: TripInputs) => Promise<GenerateResult | null>
  createBlank: (inputs: TripInputs) => Promise<GenerateResult | null>
  clearError: () => void
}

async function createTripDoc(userId: string, inputs: TripInputs) {
  return addDoc(collection(db, 'trips'), {
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    inputs,
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
      try {
        tripRef = await createTripDoc(user.uid, inputs)
        const res = await fetch(`${FUNCTIONS_BASE_URL}/generateTrip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }
        const { plan } = (await res.json()) as { plan: TripPlan }
        await updateDoc(doc(db, 'trips', tripRef.id), {
          plan,
          status: 'complete',
          updatedAt: serverTimestamp(),
        })
        return { tripId: tripRef.id, plan }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed'
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
        setIsGenerating(false)
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
          plan,
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

  return { isGenerating, error, generate, createBlank, clearError }
}
