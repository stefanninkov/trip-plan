import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface SharingOptions {
  /** If true, strip personal notes, tips, warnings from the shared copy. */
  excludeNotes?: boolean
  /** If true, strip all cost data (per-item costs and daily/grand totals). */
  excludeCosts?: boolean
}

export function randomToken(length = 20): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

export async function enableSharing(
  tripId: string,
  options: SharingOptions = {}
): Promise<string> {
  const token = randomToken(24)
  await updateDoc(doc(db, 'trips', tripId), {
    shared: true,
    shareToken: token,
    shareOptions: {
      excludeNotes: options.excludeNotes ?? false,
      excludeCosts: options.excludeCosts ?? false,
    },
    updatedAt: serverTimestamp(),
  })
  return token
}

export async function disableSharing(tripId: string): Promise<void> {
  await updateDoc(doc(db, 'trips', tripId), {
    shared: false,
    shareToken: null,
    updatedAt: serverTimestamp(),
  })
}

export function buildShareUrl(token: string): string {
  const base =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname.split('/').slice(0, 2).join('/')}`
      : ''
  return `${base}/shared/${token}`
}
