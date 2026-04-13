import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { TripDocument } from '@/types/api'
import { logger } from '@/utils/logger'

interface UseSharedTripState {
  trip: TripDocument | null
  isLoading: boolean
  error: string | null
}

/**
 * Look up a trip by its public shareToken. No auth required because Firestore
 * rules allow read on documents with shared == true.
 */
export function useSharedTrip(shareToken: string | undefined): UseSharedTripState {
  const [trip, setTrip] = useState<TripDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shareToken) {
      setIsLoading(false)
      return
    }
    const q = query(
      collection(db, 'trips'),
      where('shareToken', '==', shareToken),
      where('shared', '==', true),
      limit(1)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setTrip(null)
          setError('Shared trip not found or no longer available')
        } else {
          const doc = snap.docs[0]
          setTrip({ id: doc.id, ...(doc.data() as Omit<TripDocument, 'id'>) })
          setError(null)
        }
        setIsLoading(false)
      },
      (err) => {
        logger.error('useSharedTrip:', err)
        setError(err.message)
        setIsLoading(false)
      }
    )
    return unsub
  }, [shareToken])

  return { trip, isLoading, error }
}
