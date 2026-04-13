import { lazy, Suspense, type ReactElement } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthListener } from '@/hooks/useAuth'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { AppShell } from '@/components/layout/AppShell'
import { ToastContainer } from '@/components/shared/Toast'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { CardSkeleton } from '@/components/shared/Skeleton'
import { ROUTES, ROUTE_PATTERNS } from '@/constants/routes'
import { SignInPage } from '@/pages/SignInPage'
import { HomePage } from '@/pages/HomePage'

// Lazy-load heavier routes so the initial bundle stays small
const NewTripPage = lazy(() =>
  import('@/pages/NewTripPage').then((m) => ({ default: m.NewTripPage }))
)
const ExplorePage = lazy(() =>
  import('@/pages/ExplorePage').then((m) => ({ default: m.ExplorePage }))
)
const TripPage = lazy(() => import('@/pages/TripPage').then((m) => ({ default: m.TripPage })))
const HistoryPage = lazy(() =>
  import('@/pages/HistoryPage').then((m) => ({ default: m.HistoryPage }))
)
const SharedTripPage = lazy(() =>
  import('@/pages/SharedTripPage').then((m) => ({ default: m.SharedTripPage }))
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
)

// Vite sets BASE_URL from vite.config.ts `base` ('/trip-plan/' in prod, '/' in dev).
// BrowserRouter basename must not have a trailing slash.
const ROUTER_BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '')

function AuthedRoute({ element }: { element: ReactElement }) {
  return <AuthGuard>{element}</AuthGuard>
}

function LazyFallback() {
  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-3">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}

export function App() {
  useAuthListener()

  return (
    <ErrorBoundary>
      <BrowserRouter basename={ROUTER_BASENAME}>
        <Suspense fallback={<LazyFallback />}>
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
              path={ROUTES.explore}
              element={<AuthedRoute element={<AppShell><ExplorePage /></AppShell>} />}
            />
            <Route
              path={ROUTE_PATTERNS.trip}
              element={<AuthedRoute element={<AppShell><TripPage /></AppShell>} />}
            />
            <Route
              path={ROUTES.myTrips}
              element={<AuthedRoute element={<AppShell><HistoryPage /></AppShell>} />}
            />
            {/* Legacy redirect: old /history links still land on /trips */}
            <Route
              path="/history"
              element={<AuthedRoute element={<AppShell><HistoryPage /></AppShell>} />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
