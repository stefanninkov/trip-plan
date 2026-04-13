import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Plane, AlertTriangle, Calendar, Users } from 'lucide-react'
import { useTrips } from '@/hooks/useTrips'
import { useUiStore } from '@/store/ui-store'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { CardSkeleton } from '@/components/shared/Skeleton'
import { Modal } from '@/components/shared/Modal'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { formatDateRange } from '@/utils/date-helpers'
import { ROUTES } from '@/constants/routes'

export function HistoryPage() {
  const { trips, isLoading, error, deleteTrip } = useTrips()
  const addToast = useUiStore((s) => s.addToast)
  const [toDelete, setToDelete] = useState<string | null>(null)

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await deleteTrip(toDelete)
      addToast('info', 'Trip deleted')
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">My trips</p>
        <h1>Your trips</h1>
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
          <h3>No trips yet</h3>
          <p className="text-text-secondary max-w-md">
            Plan your first trip with AI, or build one manually from scratch.
          </p>
          <Link to={ROUTES.newTrip}>
            <Button>Plan a trip</Button>
          </Link>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {trips.map((trip) => {
          const title =
            trip.plan?.tripTitle ??
            (trip.inputs.destinations.map((d) => d.city).filter(Boolean).join(' \u2192 ') ||
              'Untitled trip')
          return (
            <Card key={trip.id} className="flex flex-col md:flex-row md:items-center gap-3 group">
              <Link to={ROUTES.trip(trip.id)} className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate m-0">{title}</h3>
                  {trip.status === 'generating' && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded bg-accent-muted text-accent">
                      Generating
                    </span>
                  )}
                  {trip.status === 'error' && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded bg-[#D9555520] text-error">
                      Failed
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
                  onClick={() => setToDelete(trip.id)}
                  aria-label="Delete trip"
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
        title="Delete this trip?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button onClick={confirmDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-text-secondary">
          This removes the plan and all edits permanently. This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
