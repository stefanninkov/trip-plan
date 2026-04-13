import { useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/store/auth-store'
import { logger } from '@/utils/logger'

export interface PresenceEntry {
  uid: string
  displayName: string
  photoURL: string | null
  updatedAt: number
}

const STALE_MS = 60_000 // 60s — consider a presence doc stale after this

/**
 * Tracks who else is currently viewing / editing the same trip. Writes a
 * heartbeat doc under `trips/{tripId}/presence/{uid}` every 20s while
 * mounted and listens to the subcollection. Returns the current list of
 * *other* viewers (i.e. excludes self).
 */
export function usePresence(tripId: string | undefined): PresenceEntry[] {
  const user = useAuthStore((s) => s.user)
  const [others, setOthers] = useState<PresenceEntry[]>([])

  useEffect(() => {
    if (!tripId || !user) return
    const selfRef = doc(db, 'trips', tripId, 'presence', user.uid)

    const heartbeat = async () => {
      try {
        await setDoc(
          selfRef,
          {
            uid: user.uid,
            displayName: user.displayName ?? 'Anonymous',
            photoURL: user.photoURL ?? null,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } catch (err) {
        logger.warn('presence heartbeat failed', err)
      }
    }
    void heartbeat()
    const intervalId = window.setInterval(() => void heartbeat(), 20_000)

    const unsub = onSnapshot(
      collection(db, 'trips', tripId, 'presence'),
      (snap) => {
        const now = Date.now()
        const list: PresenceEntry[] = []
        snap.forEach((d) => {
          const data = d.data() as Partial<PresenceEntry> & { updatedAt?: Timestamp }
          if (!data?.uid || data.uid === user.uid) return
          const ts = data.updatedAt?.toDate?.().getTime() ?? 0
          if (now - ts > STALE_MS) return
          list.push({
            uid: data.uid,
            displayName: data.displayName ?? 'Anonymous',
            photoURL: data.photoURL ?? null,
            updatedAt: ts,
          })
        })
        setOthers(list)
      },
      (err) => logger.warn('presence listener error', err)
    )

    const cleanup = () => {
      deleteDoc(selfRef).catch(() => undefined)
    }
    window.addEventListener('beforeunload', cleanup)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('beforeunload', cleanup)
      cleanup()
      unsub()
    }
  }, [tripId, user])

  return others
}
