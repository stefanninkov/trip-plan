import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { ROUTES } from '@/constants/routes'

export function SignInPage() {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (!isLoading && user) {
    return <Navigate to={ROUTES.home} replace />
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
        <svg width="48" height="48" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#1A1A1E" stroke="#3A3A42" />
          <path d="M8 22 L16 8 L24 22 L20 22 L16 14 L12 22 Z" fill="#E49B5A" />
        </svg>
        <div className="flex flex-col gap-2">
          <h1>Trip Plan</h1>
          <p className="text-text-secondary">
            AI-powered trip planning with real-time search, full itineraries, and budget tracking.
          </p>
        </div>
        <GoogleSignInButton />
        <p className="text-[12px] text-text-tertiary">
          By signing in, you agree to use the app for personal trip planning.
        </p>
      </div>
    </div>
  )
}
