import { useEffect } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/store/auth-store'
import { logger } from '@/utils/logger'
import type { UserProfile } from '@/types/user'

function mapUser(user: User): UserProfile {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    photoURL: user.photoURL,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  }
}

export function useAuthListener(): void {
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(mapUser(user))
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [setUser, setLoading])
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const result = await signInWithPopup(auth, provider)
  const { user } = result

  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    )
  } catch (err) {
    logger.error('Failed to persist user profile:', err)
  }
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth)
}
