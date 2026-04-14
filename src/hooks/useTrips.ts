import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/store/auth-store'
import { logger } from '@/utils/logger'
import { sanitizeForFirestore } from '@/utils/sanitize'
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

  /**
   * Create a copy of a trip under the current user. The plan / inputs /
   * shareOptions are preserved; the share token is cleared so the copy
   * is private, and createdAt/updatedAt are reset.
   */
  const duplicateTrip = async (tripId: string): Promise<string | null> => {
    if (!user) return null
    try {
      const snap = await getDoc(doc(db, 'trips', tripId))
      if (!snap.exists()) return null
      const data = snap.data() as Partial<TripDocument>
      const ref = await addDoc(collection(db, 'trips'), {
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        inputs: sanitizeForFirestore(data.inputs ?? {}),
        plan: data.plan ? sanitizeForFirestore(data.plan) : null,
        status: data.plan ? 'complete' : 'generating',
        shared: false,
        shareToken: null,
      })
      return ref.id
    } catch (err) {
      logger.error('duplicateTrip failed:', err)
      return null
    }
  }

  return { trips, isLoading, error, deleteTrip, duplicateTrip }
}
