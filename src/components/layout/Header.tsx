import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { UserMenu } from '@/components/auth/UserMenu'
import { Button } from '@/components/shared/Button'

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-bg-primary/90 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 lg:px-10 h-14 flex items-center justify-between">
        <Link to={ROUTES.home} className="flex items-center gap-2 no-underline">
          <Logo />
          <span className="font-heading text-[15px] font-semibold tracking-tight">Trip Plan</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to={ROUTES.newTrip}>
            <Button variant="primary" className="flex items-center gap-1.5">
              <Plus size={14} />
              <span className="hidden sm:inline">New trip</span>
            </Button>
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1A1A1E" stroke="#3A3A42" />
      <path d="M8 22 L16 8 L24 22 L20 22 L16 14 L12 22 Z" fill="#E49B5A" />
    </svg>
  )
}
