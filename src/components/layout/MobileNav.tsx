import { Link, useLocation } from 'react-router-dom'
import { Home, Map, Briefcase, Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

export function MobileNav() {
  const location = useLocation()
  const { t } = useTranslation()

  const NAV_ITEMS = [
    { to: ROUTES.home, label: t('nav.home'), icon: Home },
    { to: ROUTES.explore, label: t('nav.explore'), icon: Compass },
    { to: ROUTES.newTrip, label: t('app.newTrip'), icon: Map },
    { to: ROUTES.myTrips, label: t('nav.myTrips'), icon: Briefcase },
  ]

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
