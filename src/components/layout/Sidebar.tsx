import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Map, Briefcase, Compass } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { useTrips } from '@/hooks/useTrips'
import { formatDateRange } from '@/utils/date-helpers'
import { getExploreHistory, type ExploreHistoryEntry } from '@/utils/explore-history'
import { useExplore } from '@/hooks/useExplore'

const NAV_ITEMS = [
  { to: ROUTES.home, label: 'Home', icon: Home },
  { to: ROUTES.explore, label: 'Explore', icon: Compass },
  { to: ROUTES.newTrip, label: 'New trip', icon: Map },
  { to: ROUTES.myTrips, label: 'My Trips', icon: Briefcase },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { trips } = useTrips()
  const recentTrips = trips.slice(0, 10)
  const { run: runExplore, overview: exploreOverview } = useExplore()
  const [exploreHistory, setExploreHistory] = useState<ExploreHistoryEntry[]>(() =>
    getExploreHistory()
  )
  // Refresh when new entries are pushed to localStorage (after a successful run).
  useEffect(() => {
    setExploreHistory(getExploreHistory())
  }, [exploreOverview])

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
              (trip.inputs.destinations.map((d) => d.city).filter(Boolean).join(' → ') ||
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

      {exploreHistory.length > 0 && (
        <div className="px-3 pb-3 flex flex-col gap-1">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-text-tertiary">
            Recently explored
          </div>
          {exploreHistory.slice(0, 8).map((entry) => (
            <button
              key={entry.query}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                // Kick the run off first (synchronous cache hit will populate
                // the overview immediately) then navigate so ExplorePage
                // mounts reading the freshly-populated store state.
                void runExplore(entry.query)
                if (location.pathname !== ROUTES.explore) {
                  navigate(ROUTES.explore)
                }
              }}
              className="text-left flex flex-col gap-0.5 px-3 py-2 rounded-lg hover:bg-bg-surface transition-colors duration-150"
            >
              <span className="text-[13px] font-medium truncate text-text-primary">
                {entry.name}
              </span>
              {entry.country && entry.name !== entry.country && (
                <span className="text-[11px] text-text-tertiary truncate">{entry.country}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </aside>
  )
}
