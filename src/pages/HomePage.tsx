import { Link } from 'react-router-dom'
import { Map, Clock, Sparkles, Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth-store'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'

export function HomePage() {
  const user = useAuthStore((s) => s.user)
  const { t } = useTranslation()
  const firstName = user?.displayName?.split(' ')[0] ?? 'there'

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">
          {t('home.welcome')}
        </p>
        <h1>{t('home.hello', { name: firstName })}</h1>
        <p className="text-text-secondary max-w-xl">{t('home.lede')}</p>
        <div className="flex gap-3 mt-2 flex-wrap">
          <Link to={ROUTES.newTrip}>
            <Button>
              <span className="flex items-center gap-2">
                <Sparkles size={14} />
                {t('home.planNew')}
              </span>
            </Button>
          </Link>
          <Link to={ROUTES.explore}>
            <Button variant="secondary">
              <span className="flex items-center gap-2">
                <Compass size={14} />
                {t('home.explore')}
              </span>
            </Button>
          </Link>
          <Link to={ROUTES.myTrips}>
            <Button variant="secondary">{t('home.myTrips')}</Button>
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
              <h3 className="mb-1">{t('home.feature1Title')}</h3>
              <p className="text-text-secondary text-[13px]">{t('home.feature1Body')}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
              <Clock size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="mb-1">{t('home.feature2Title')}</h3>
              <p className="text-text-secondary text-[13px]">{t('home.feature2Body')}</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
