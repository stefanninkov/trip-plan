import { Link, useLocation } from 'react-router-dom'
import { Home, Map, Clock } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { useTrips } from '@/hooks/useTrips'
import { formatDateRange } from '@/utils/date-helpers'

const NAV_ITEMS = [
  { to: ROUTES.home, label: 'Home', icon: Home },
  { to: ROUTES.newTrip, label: 'New trip', icon: Map },
  { to: ROUTES.history, label: 'History', icon: Clock },
]

export function Sidebar() {
  const location = useLocation()
  const { trips } = useTrips()
  const recentTrips = trips.slice(0, 10)

  return (
    <aside
      className="hidden lg:flex lg:flex-col w-[240px] shrink-0 bg-bg-secondary border-r border-border-subtle sticky top-14 self-start overflow-y-auto"
      style={{ height: 'calc(100dvh - 56px)' }}
    >
      <nav className="p-3 flex flex-col gap-1" aria-label="Primary">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active =
            to === ROUTES.home ? location.pathname === to : location.pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium',
                'transition-colors duration-150',
                active
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {recentTrips.length > 0 && (
        <div className="px-3 pb-3 flex flex-col gap-1">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-text-tertiary">
            Recent trips
          </div>
          {recentTrips.map((trip) => {
            const title =
              trip.plan?.tripTitle ??
              (trip.inputs.destinations.map((d) => d.city).filter(Boolean).join(' \u2192 ') ||
                'Untitled')
            const active = location.pathname === ROUTES.trip(trip.id)
            return (
              <Link
                key={trip.id}
                to={ROUTES.trip(trip.id)}
                className={cn(
                  'flex flex-col gap-0.5 px-3 py-2 rounded-lg',
                  'transition-colors duration-150',
                  active
                    ? 'bg-bg-elevated'
                    : 'hover:bg-bg-surface'
                )}
              >
                <span className="text-[13px] font-medium truncate text-text-primary">
                  {title}
                </span>
                <span className="text-[11px] text-text-tertiary truncate">
                  {formatDateRange(trip.inputs.startDate, trip.inputs.endDate)}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </aside>
  )
}
