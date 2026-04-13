import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'
import { logger } from '@/utils/logger'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig)
export const auth: Auth = getAuth(firebaseApp)

// Firestore with IndexedDB persistence — saved trips are readable offline once
// they've been loaded at least once while online.
export const db: Firestore = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

export const FUNCTIONS_BASE_URL: string =
  import.meta.env.VITE_FUNCTIONS_BASE_URL ?? ''

// Analytics loads only in supported environments (skipped during SSR / dev preview)
export let analytics: Analytics | null = null
if (firebaseConfig.measurementId && import.meta.env.PROD) {
  void isSupported()
    .then((supported) => {
      if (supported) analytics = getAnalytics(firebaseApp)
    })
    .catch((err) => {
      logger.warn('Analytics init failed:', err)
    })
}
