import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { ROUTES } from '@/constants/routes'
import { CardSkeleton } from '@/components/shared/Skeleton'

export interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <CardSkeleton />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={ROUTES.signIn} state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
