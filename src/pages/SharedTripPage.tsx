import { useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useSharedTrip } from '@/hooks/useSharedTrip'
import { PlanView } from '@/components/plan/PlanView'
import { Card } from '@/components/shared/Card'
import { CardSkeleton } from '@/components/shared/Skeleton'

export function SharedTripPage() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const { trip, isLoading, error } = useSharedTrip(shareToken)

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="w-full max-w-3xl flex flex-col gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (error || !trip || !trip.plan) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <Card className="max-w-md flex flex-col items-center text-center gap-2">
          <AlertTriangle size={24} className="text-warning" />
          <h2>Shared trip unavailable</h2>
          <p className="text-text-secondary">{error ?? 'This link is no longer active.'}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-dvh">
      <div className="max-w-[960px] mx-auto px-4 md:px-8 lg:px-10 py-6 lg:py-10">
        <div className="mb-4 text-[12px] font-semibold uppercase tracking-[1.5px] text-text-tertiary">
          Shared with you \u00B7 read-only
        </div>
        <PlanView plan={trip.plan} tripId={trip.id} readOnly />
      </div>
    </div>
  )
}
