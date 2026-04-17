import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TripDocument } from '@/types/api'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const BAR_COLORS = [
  'var(--color-accent)',
  'var(--color-cat-transport)',
  'var(--color-cat-hotel)',
  'var(--color-cat-food)',
  'var(--color-cat-activity)',
  'var(--color-success)',
  'var(--color-info)',
  'var(--color-warning)',
]

interface TimelineTrip {
  id: string
  title: string
  start: Date
  end: Date
  color: string
}

function parseTrips(trips: TripDocument[]): TimelineTrip[] {
  return trips
    .filter((t) => t.inputs.startDate && t.inputs.endDate)
    .map((t, i) => ({
      id: t.id,
      title:
        t.plan?.tripTitle ??
        t.inputs.destinations.map((d) => d.city).filter(Boolean).join(' → ') ??
        'Untitled',
      start: new Date(t.inputs.startDate),
      end: new Date(t.inputs.endDate),
      color: BAR_COLORS[i % BAR_COLORS.length],
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}

function monthsBetween(start: Date, end: Date): Date[] {
  const months: Date[] = []
  const cur = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cur <= end) {
    months.push(new Date(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

export function TripTimeline({ trips }: { trips: TripDocument[] }) {
  const { t } = useTranslation()
  const parsed = useMemo(() => parseTrips(trips), [trips])

  if (parsed.length === 0) {
    return (
      <p className="text-[13px] text-text-tertiary italic">
        {t('timeline.empty')}
      </p>
    )
  }

  const minDate = new Date(
    Math.min(...parsed.map((p) => p.start.getTime())) - 7 * 86400000
  )
  const maxDate = new Date(
    Math.max(...parsed.map((p) => p.end.getTime())) + 7 * 86400000
  )
  const months = monthsBetween(minDate, maxDate)

  const dayToPercent = (d: Date) =>
    ((d.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      {/* Month headers */}
      <div className="relative h-6 min-w-[600px]">
        {months.map((m) => {
          const left = dayToPercent(m)
          const nextMonth = new Date(m.getFullYear(), m.getMonth() + 1, 1)
          const width = dayToPercent(nextMonth) - left
          return (
            <div
              key={m.toISOString()}
              className="absolute top-0 text-[10px] text-text-tertiary uppercase tracking-[1px] font-semibold border-l border-border-subtle pl-1"
              style={{ left: `${Math.max(0, left)}%`, width: `${width}%` }}
            >
              {MONTH_NAMES_SHORT[m.getMonth()]} {m.getFullYear()}
            </div>
          )
        })}
      </div>

      {/* Trip bars */}
      <div className="relative min-w-[600px] flex flex-col gap-1.5">
        {parsed.map((trip) => {
          const left = dayToPercent(trip.start)
          const right = dayToPercent(trip.end)
          const width = Math.max(1, right - left)
          const days = Math.round((trip.end.getTime() - trip.start.getTime()) / 86400000)
          return (
            <Link
              key={trip.id}
              to={ROUTES.trip(trip.id)}
              className="relative h-8 group"
              title={`${trip.title} (${days} days)`}
            >
              <div
                className={cn(
                  'absolute top-0 h-full rounded-md flex items-center px-2 text-[11px] font-semibold text-bg-primary truncate transition-opacity hover:opacity-90',
                )}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: trip.color,
                  minWidth: 40,
                }}
              >
                {trip.title}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Today marker */}
      {(() => {
        const todayPct = dayToPercent(new Date())
        if (todayPct < 0 || todayPct > 100) return null
        return (
          <div className="relative h-0 min-w-[600px]">
            <div
              className="absolute top-[-100%] w-px bg-error"
              style={{
                left: `${todayPct}%`,
                height: `calc(100% + ${parsed.length * 38 + 24}px)`,
                top: `-${parsed.length * 38 + 24}px`,
              }}
            />
            <div
              className="absolute text-[9px] text-error font-semibold"
              style={{ left: `${todayPct}%`, transform: 'translateX(-50%)' }}
            >
              {t('common.today')}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
