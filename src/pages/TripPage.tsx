import { useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useTrip } from '@/hooks/useTrip'
import { PlanView } from '@/components/plan/PlanView'
import { Card } from '@/components/shared/Card'
import { CardSkeleton } from '@/components/shared/Skeleton'

export function TripPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { trip, isLoading, error } = useTrip(tripId)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (error || !trip) {
    return (
      <Card className="flex flex-col items-center gap-2 text-center">
        <AlertTriangle size={24} className="text-warning" />
        <h2>Trip not found</h2>
        <p className="text-text-secondary">{error ?? 'We could not find that trip.'}</p>
      </Card>
    )
  }

  if (trip.status === 'generating') {
    return (
      <div className="flex flex-col gap-4">
        <h1>Generating your plan\u2026</h1>
        <p className="text-text-secondary">
          Claude is putting together your itinerary. This usually takes 20\u201360 seconds.
        </p>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (trip.status === 'error' || !trip.plan) {
    return (
      <Card className="flex flex-col items-center gap-2 text-center">
        <AlertTriangle size={24} className="text-error" />
        <h2>Generation failed</h2>
        <p className="text-text-secondary">
          Something went wrong while creating this plan. Try generating a new trip.
        </p>
      </Card>
    )
  }

  return <PlanView plan={trip.plan} />
}
