import type { ReactElement } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthListener } from '@/hooks/useAuth'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { AppShell } from '@/components/layout/AppShell'
import { ToastContainer } from '@/components/shared/Toast'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { ROUTES, ROUTE_PATTERNS } from '@/constants/routes'
import { HomePage } from '@/pages/HomePage'
import { NewTripPage } from '@/pages/NewTripPage'
import { TripPage } from '@/pages/TripPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { SignInPage } from '@/pages/SignInPage'
import { SharedTripPage } from '@/pages/SharedTripPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

function AuthedRoute({ element }: { element: ReactElement }) {
  return <AuthGuard>{element}</AuthGuard>
}

export function App() {
  useAuthListener()

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.signIn} element={<SignInPage />} />
          <Route path={ROUTE_PATTERNS.shared} element={<SharedTripPage />} />
          <Route
            path={ROUTES.home}
            element={<AuthedRoute element={<AppShell><HomePage /></AppShell>} />}
          />
          <Route
            path={ROUTES.newTrip}
            element={<AuthedRoute element={<AppShell><NewTripPage /></AppShell>} />}
          />
          <Route
            path={ROUTE_PATTERNS.trip}
            element={<AuthedRoute element={<AppShell><TripPage /></AppShell>} />}
          />
          <Route
            path={ROUTES.history}
            element={<AuthedRoute element={<AppShell><HistoryPage /></AppShell>} />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
