import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plane, AlertTriangle, Calendar, CalendarRange, Users, Wrench, Copy, List } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTrips } from '@/hooks/useTrips'
import { useUiStore } from '@/store/ui-store'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { CardSkeleton } from '@/components/shared/Skeleton'
import { Modal } from '@/components/shared/Modal'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { formatDateRange } from '@/utils/date-helpers'
import { ROUTES } from '@/constants/routes'
import { TripTimeline } from '@/components/plan/TripTimeline'

/**
 * A trip is "stuck" if it's been in the generating state for more than 10
 * minutes. We give users an explicit "clean up" action for these since the
 * Cloud Function should never take that long.
 */
const STUCK_THRESHOLD_MS = 10 * 60 * 1000

export function HistoryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { trips, isLoading, error, deleteTrip, duplicateTrip } = useTrips()
  const addToast = useUiStore((s) => s.addToast)
  const [toDelete, setToDelete] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'timeline'>('list')

  const handleDuplicate = async (tripId: string): Promise<void> => {
    const newId = await duplicateTrip(tripId)
    if (newId) {
      addToast('success', t('history.duplicated'))
      navigate(ROUTES.trip(newId))
    } else {
      addToast('error', t('history.duplicateFailed'))
    }
  }

  const stuckTrips = useMemo(
    () =>
      trips.filter((trip) => {
        if (trip.status !== 'generating') return false
        const updatedAt = trip.updatedAt ? new Date(trip.updatedAt).getTime() : 0
        return updatedAt > 0 && Date.now() - updatedAt > STUCK_THRESHOLD_MS
      }),
    [trips]
  )

  const cleanStuck = async (): Promise<void> => {
    let deleted = 0
    for (const trip of stuckTrips) {
      try {
        await deleteTrip(trip.id)
        deleted++
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('cleanStuck failed', err)
      }
    }
    if (deleted > 0) {
      addToast('success', t('history.cleanedStuck', { count: deleted }))
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await deleteTrip(toDelete)
      addToast('info', t('history.deleted'))
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">
            {t('nav.myTrips')}
          </p>
          <h1>{t('history.heading')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {trips.length > 0 && (
            <div className="flex items-center rounded-lg border border-border-default overflow-hidden">
              <button
                type="button"
                onClick={() => setView('list')}
                className={`px-3 py-1.5 text-[12px] flex items-center gap-1.5 transition-colors ${
                  view === 'list'
                    ? 'bg-bg-elevated text-text-primary'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
                aria-label={t('timeline.listView')}
              >
                <List size={13} />
                {t('timeline.listView')}
              </button>
              <button
                type="button"
                onClick={() => setView('timeline')}
                className={`px-3 py-1.5 text-[12px] flex items-center gap-1.5 transition-colors ${
                  view === 'timeline'
                    ? 'bg-bg-elevated text-text-primary'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
                aria-label={t('timeline.timelineView')}
              >
                <CalendarRange size={13} />
                {t('timeline.timelineView')}
              </button>
            </div>
          )}
          {stuckTrips.length > 0 && (
            <Button
              variant="secondary"
              onClick={cleanStuck}
              className="flex items-center gap-1.5"
            >
              <Wrench size={14} />
              {t('history.cleanStuck', { count: stuckTrips.length })}
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {error && (
        <Card className="flex items-center gap-3 text-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </Card>
      )}

      {!isLoading && !error && trips.length === 0 && (
        <Card className="flex flex-col items-center text-center gap-3 py-10">
          <Plane size={32} className="text-text-tertiary" />
          <h3>{t('history.emptyTitle')}</h3>
          <p className="text-text-secondary max-w-md">{t('history.emptyBody')}</p>
          <Link to={ROUTES.newTrip}>
            <Button>{t('home.planNew')}</Button>
          </Link>
        </Card>
      )}

      {view === 'timeline' && trips.length > 0 && (
        <Card className="p-5">
          <TripTimeline trips={trips} />
        </Card>
      )}

      <div className={`flex flex-col gap-3 ${view === 'timeline' ? 'hidden' : ''}`}>
        {trips.map((trip) => {
          const title =
            trip.plan?.tripTitle ??
            (trip.inputs.destinations.map((d) => d.city).filter(Boolean).join(' → ') ||
              t('history.untitled'))
          return (
            <Card key={trip.id} className="flex flex-col md:flex-row md:items-center gap-3 group">
              <Link to={ROUTES.trip(trip.id)} className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate m-0">{title}</h3>
                  {trip.status === 'generating' && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded bg-accent-muted text-accent">
                      {t('history.statusGenerating')}
                    </span>
                  )}
                  {trip.status === 'error' && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded bg-[#D9555520] text-error">
                      {t('history.statusFailed')}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[12px] text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDateRange(trip.inputs.startDate, trip.inputs.endDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {trip.inputs.travelers}
                  </span>
                </div>
              </Link>
              <div className="flex items-center gap-3">
                {trip.plan && (
                  <CurrencyDisplay
                    min={trip.plan.grandTotal.total.min}
                    max={trip.plan.grandTotal.total.max}
                    currency={trip.plan.totalBudget.currency}
                    size="md"
                  />
                )}
                <button
                  type="button"
                  onClick={() => void handleDuplicate(trip.id)}
                  aria-label={t('history.duplicate')}
                  title={t('history.duplicate')}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-text-tertiary hover:bg-bg-elevated hover:text-text-primary transition-colors"
                >
                  <Copy size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(trip.id)}
                  aria-label={t('common.delete')}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-text-tertiary hover:bg-bg-elevated hover:text-error transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={t('history.deleteTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmDelete}>{t('common.delete')}</Button>
          </>
        }
      >
        <p className="text-text-secondary">{t('history.deleteBody')}</p>
      </Modal>
    </div>
  )
}
