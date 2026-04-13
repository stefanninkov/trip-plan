import { useParams } from 'react-router-dom'
import { Card } from '@/components/shared/Card'

export function TripPage() {
  const { tripId } = useParams<{ tripId: string }>()
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">Trip</p>
        <h1>Trip #{tripId}</h1>
      </div>
      <Card>
        <p className="text-text-secondary">
          The plan view with day cards, drag-and-drop timeline, cost breakdown, and hotel options
          will be built in Phase D.
        </p>
      </Card>
    </div>
  )
}
