import { useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/store/auth-store'
import { logger } from '@/utils/logger'
import type { TripDocument } from '@/types/api'

interface TripListItem extends Omit<TripDocument, 'createdAt' | 'updatedAt'> {
  createdAt: string
  updatedAt: string
}

function toIso(ts: unknown): string {
  if (ts && typeof ts === 'object' && 'toDate' in (ts as Timestamp)) {
    return (ts as Timestamp).toDate().toISOString()
  }
  return typeof ts === 'string' ? ts : ''
}

/**
 * Subscribes to the authenticated user's trips, newest first.
 */
export function useTrips() {
  const user = useAuthStore((s) => s.user)
  const [trips, setTrips] = useState<TripListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setTrips([])
      setIsLoading(false)
      return
    }
    const q = query(
      collection(db, 'trips'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            userId: data.userId,
            inputs: data.inputs,
            plan: data.plan ?? null,
            status: data.status,
            shared: data.shared ?? false,
            shareToken: data.shareToken ?? null,
            createdAt: toIso(data.createdAt),
            updatedAt: toIso(data.updatedAt),
          } as TripListItem
        })
        setTrips(docs)
        setIsLoading(false)
      },
      (err) => {
        logger.error('useTrips listener:', err)
        setError(err.message)
        setIsLoading(false)
      }
    )
    return unsub
  }, [user])

  const deleteTrip = async (tripId: string): Promise<void> => {
    await deleteDoc(doc(db, 'trips', tripId))
  }

  return { trips, isLoading, error, deleteTrip }
}
