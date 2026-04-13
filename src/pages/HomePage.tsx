import { Link } from 'react-router-dom'
import { Map, Clock, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'

export function HomePage() {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.displayName?.split(' ')[0] ?? 'there'

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">
          Welcome back
        </p>
        <h1>Hello, {firstName}</h1>
        <p className="text-text-secondary max-w-xl">
          Plan a new trip with AI or revisit your saved itineraries. Each plan includes
          hour-by-hour schedules, hotel options in all budget tiers, and web-searched prices.
        </p>
        <div className="flex gap-3 mt-2">
          <Link to={ROUTES.newTrip}>
            <Button>
              <span className="flex items-center gap-2">
                <Sparkles size={14} />
                Plan a new trip
              </span>
            </Button>
          </Link>
          <Link to={ROUTES.history}>
            <Button variant="secondary">View history</Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
              <Map size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="mb-1">Multi-city, hour-by-hour</h3>
              <p className="text-text-secondary text-[13px]">
                Describe your trip once. Get a full day-by-day plan with real hotels, transport
                options, and activities.
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
              <Clock size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="mb-1">Editable timeline</h3>
              <p className="text-text-secondary text-[13px]">
                Drag blocks between days, swap hotels, and trigger live web searches for flights,
                stays, and places.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
