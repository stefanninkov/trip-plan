import { Link, useLocation } from 'react-router-dom'
import { Home, Map, Clock } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { to: ROUTES.home, label: 'Home', icon: Home },
  { to: ROUTES.newTrip, label: 'New trip', icon: Map },
  { to: ROUTES.history, label: 'History', icon: Clock },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside
      className="hidden lg:block w-[240px] shrink-0 bg-bg-secondary border-r border-border-subtle sticky top-14 self-start"
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
    </aside>
  )
}
