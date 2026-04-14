import { Link } from 'react-router-dom'
import { CalendarCheck, ArrowRight, MapPin, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TripPlan, DayPlan } from '@/types/trip-plan'
import type { TripDocument } from '@/types/api'
import { ROUTES } from '@/constants/routes'
import { todayIso } from '@/utils/date-helpers'

export interface TodayCardProps {
  trips: Array<
    Omit<TripDocument, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string }
  >
}

interface Hit {
  tripId: string
  tripTitle: string
  day: DayPlan
  plan: TripPlan
}

function findToday(trips: TodayCardProps['trips']): Hit | null {
  const today = todayIso()
  for (const trip of trips) {
    if (!trip.plan) continue
    const day = trip.plan.days.find((d) => d.date === today)
    if (day) {
      return {
        tripId: trip.id,
        tripTitle: trip.plan.tripTitle,
        day,
        plan: trip.plan,
      }
    }
  }
  return null
}

function findUpcoming(trips: TodayCardProps['trips']): Hit | null {
  const today = todayIso()
  // Sort by the first day date, pick the nearest future trip.
  let best: Hit | null = null
  let bestDelta = Infinity
  for (const trip of trips) {
    if (!trip.plan) continue
    const first = trip.plan.days[0]
    if (!first) continue
    if (first.date < today) continue
    const delta =
      (new Date(first.date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    if (delta < bestDelta) {
      bestDelta = delta
      best = {
        tripId: trip.id,
        tripTitle: trip.plan.tripTitle,
        day: first,
        plan: trip.plan,
      }
    }
  }
  return best
}

/**
 * Home-page banner that shows TODAY's plan when a trip is active, or the
 * next upcoming trip with a countdown. Returns null if neither applies.
 */
export function TodayCard({ trips }: TodayCardProps) {
  const { t } = useTranslation()
  const today = findToday(trips)
  const upcoming = !today ? findUpcoming(trips) : null

  if (today) {
    const nextBlock = today.day.blocks[0]
    return (
      <Link
        to={ROUTES.trip(today.tripId)}
        className="group block rounded-2xl border border-accent/50 bg-accent-muted/20 p-5 flex flex-col gap-3 hover:border-accent hover:bg-accent-muted/40 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-accent">
            <CalendarCheck size={13} />
            {t('today.kicker')}
          </div>
          <ArrowRight size={16} className="text-text-tertiary group-hover:text-accent transition-colors" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-[20px] font-semibold">
            {t('today.dayN', { n: today.day.dayNumber })} · {today.day.title}
          </h2>
          <div className="flex items-center gap-3 text-[13px] text-text-secondary">
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} />
              {today.day.location}
            </span>
            <span className="text-text-tertiary">· {today.tripTitle}</span>
          </div>
        </div>
        {nextBlock && (
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-3 flex items-start gap-3">
            <Clock size={14} className="text-accent shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-cost text-[12px] text-text-tertiary">{nextBlock.time}</span>
                <span className="text-[10px] uppercase tracking-[0.5px] text-text-tertiary">
                  {t('today.next')}
                </span>
              </div>
              <span className="text-[14px] font-semibold truncate">{nextBlock.title}</span>
            </div>
          </div>
        )}
      </Link>
    )
  }

  if (upcoming) {
    const daysTo = Math.max(
      0,
      Math.round(
        (new Date(upcoming.day.date).getTime() - new Date(todayIso()).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    )
    return (
      <Link
        to={ROUTES.trip(upcoming.tripId)}
        className="group block rounded-2xl border border-border-subtle bg-bg-secondary p-5 flex flex-col gap-2 hover:border-border-default transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-text-tertiary">
            <CalendarCheck size={13} />
            {t('today.upcomingKicker')}
          </div>
          <ArrowRight size={16} className="text-text-tertiary group-hover:text-accent transition-colors" />
        </div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-[20px] font-semibold m-0">{upcoming.tripTitle}</h2>
          <span className="text-[13px] text-text-secondary">
            {daysTo === 0
              ? t('today.startsToday')
              : daysTo === 1
                ? t('today.startsTomorrow')
                : t('today.startsInDays', { count: daysTo })}
          </span>
        </div>
      </Link>
    )
  }

  return null
}
