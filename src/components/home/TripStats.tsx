import { useMemo } from 'react'
import { Plane, Briefcase, Wallet, Map } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TripDocument } from '@/types/api'
import { formatCurrency } from '@/utils/format-currency'
import { convertSync } from '@/utils/currency-rates'

export interface TripStatsProps {
  trips: Array<
    Omit<TripDocument, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string }
  >
}

/**
 * Compact stats strip on the home page: number of trips, unique
 * countries visited, total days planned, total spend across trips
 * (rolled up to EUR).
 */
export function TripStats({ trips }: TripStatsProps) {
  const { t } = useTranslation()

  const stats = useMemo(() => {
    const countries = new Set<string>()
    let totalDays = 0
    let totalEur = 0
    let tripsCount = 0

    for (const trip of trips) {
      if (!trip.plan) continue
      tripsCount++
      totalDays += trip.plan.days.length
      for (const dest of trip.inputs?.destinations ?? []) {
        if (dest.country) countries.add(dest.country)
      }
      const g = trip.plan.grandTotal?.total
      const curr = trip.plan.totalBudget?.currency
      if (g && curr) {
        const avg = (g.min + g.max) / 2
        const inEur = curr === 'EUR' ? avg : (convertSync(avg, curr, 'EUR') ?? 0)
        totalEur += inEur
      }
    }

    return { tripsCount, countries: countries.size, totalDays, totalEur }
  }, [trips])

  if (stats.tripsCount === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <Stat icon={Briefcase} label={t('stats.trips')} value={String(stats.tripsCount)} />
      <Stat icon={Plane} label={t('stats.countries')} value={String(stats.countries)} />
      <Stat icon={Map} label={t('stats.daysPlanned')} value={String(stats.totalDays)} />
      <Stat
        icon={Wallet}
        label={t('stats.totalPlanned')}
        value={stats.totalEur > 0 ? formatCurrency(stats.totalEur, 'EUR') : '—'}
      />
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Plane
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-secondary p-3 flex flex-col gap-0.5">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[1px] text-text-tertiary">
        <Icon size={11} />
        {label}
      </span>
      <span className="text-[18px] font-semibold font-cost">{value}</span>
    </div>
  )
}
