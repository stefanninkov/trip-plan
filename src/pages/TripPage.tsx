import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useTrip } from '@/hooks/useTrip'
import { PlanView } from '@/components/plan/PlanView'
import { Card } from '@/components/shared/Card'
import { CardSkeleton } from '@/components/shared/Skeleton'
import { Button } from '@/components/shared/Button'
import { AiProgress } from '@/components/shared/AiProgress'
import { ROUTES } from '@/constants/routes'
import { logger } from '@/utils/logger'

const GENERATION_STAGES = [
  { at: 0, label: 'Warming up Claude…' },
  { at: 10, label: 'Mapping your route' },
  { at: 25, label: 'Picking hotels for each stop' },
  { at: 45, label: 'Filling in day-by-day activities' },
  { at: 65, label: 'Estimating costs and budget' },
  { at: 80, label: 'Polishing the final plan' },
  { at: 92, label: 'Almost there…' },
]

export function TripPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
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
    // If the trip has been stuck in 'generating' for longer than ~4 min,
    // the Cloud Function almost certainly finished (either succeeded
    // silently or crashed) without the client updating Firestore. Give the
    // user an escape hatch so they’re not stuck staring at the spinner.
    const updatedAt = trip.updatedAt ? new Date(trip.updatedAt).getTime() : 0
    const isStale = updatedAt > 0 && Date.now() - updatedAt > 4 * 60 * 1000

    const markError = async () => {
      try {
        await updateDoc(doc(db, 'trips', trip.id), {
          status: 'error',
          updatedAt: serverTimestamp(),
        })
      } catch (err) {
        logger.error('TripPage markError:', err)
      }
    }

    const deleteAndStartOver = async () => {
      try {
        await deleteDoc(doc(db, 'trips', trip.id))
        navigate(ROUTES.newTrip)
      } catch (err) {
        logger.error('TripPage deleteAndStartOver:', err)
      }
    }

    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1>Generating your plan&hellip;</h1>
          <p className="text-text-secondary">
            Claude is putting together your itinerary. This usually takes 20&ndash;60 seconds.
          </p>
        </div>
        <AiProgress
          stages={GENERATION_STAGES}
          timeConstant={22}
          hint="Takes about 30–60 seconds. You can keep this tab open or leave — the plan saves automatically."
        />
        {isStale && (
          <Card className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">This is taking unusually long.</p>
                <p className="text-[13px] text-text-secondary">
                  The request may have failed silently. You can mark this as errored and start
                  over, or delete it entirely.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={markError}>
                Mark as failed
              </Button>
              <Button onClick={deleteAndStartOver}>Delete and start over</Button>
            </div>
          </Card>
        )}
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
        <div className="flex gap-2 mt-2">
          <Button onClick={() => navigate(ROUTES.newTrip)}>Start over</Button>
        </div>
      </Card>
    )
  }

  return (
    <PlanView
      plan={trip.plan}
      tripId={trip.id}
      inputs={trip.inputs}
      shared={trip.shared}
      shareToken={trip.shareToken}
    />
  )
}
