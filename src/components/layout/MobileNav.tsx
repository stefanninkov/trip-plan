import { Link, useLocation } from 'react-router-dom'
import { Home, Map, Briefcase } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { to: ROUTES.home, label: 'Home', icon: Home },
  { to: ROUTES.newTrip, label: 'New', icon: Map },
  { to: ROUTES.myTrips, label: 'My Trips', icon: Briefcase },
]

export function MobileNav() {
  const location = useLocation()

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-bg-secondary border-t border-border-subtle flex items-center justify-around px-2"
      aria-label="Primary mobile"
    >
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        const active =
          to === ROUTES.home ? location.pathname === to : location.pathname.startsWith(to)
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-1 rounded-lg text-[11px] font-medium transition-colors',
              active ? 'text-accent' : 'text-text-secondary'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
