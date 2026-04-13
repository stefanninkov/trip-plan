import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { TripDocument } from '@/types/api'
import { logger } from '@/utils/logger'

interface UseTripState {
  trip: TripDocument | null
  isLoading: boolean
  error: string | null
}

/**
 * Subscribes to a single trip doc by ID. Updates live as Firestore changes.
 */
export function useTrip(tripId: string | undefined): UseTripState {
  const [trip, setTrip] = useState<TripDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tripId) {
      setIsLoading(false)
      return
    }

    const unsub = onSnapshot(
      doc(db, 'trips', tripId),
      (snap) => {
        if (!snap.exists()) {
          setTrip(null)
          setError('Trip not found')
        } else {
          setTrip({ id: snap.id, ...(snap.data() as Omit<TripDocument, 'id'>) })
          setError(null)
        }
        setIsLoading(false)
      },
      (err) => {
        logger.error('useTrip listener:', err)
        setError(err.message)
        setIsLoading(false)
      }
    )
    return unsub
  }, [tripId])

  return { trip, isLoading, error }
}
