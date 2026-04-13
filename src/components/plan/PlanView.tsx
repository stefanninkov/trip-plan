import type { TripPlan } from '@/types/trip-plan'
import { PlanHeader } from './PlanHeader'
import { PracticalInfo } from './PracticalInfo'
import { DayCard } from './DayCard'
import { GrandTotal } from './GrandTotal'

export interface PlanViewProps {
  plan: TripPlan
}

export function PlanView({ plan }: PlanViewProps) {
  const currency = plan.totalBudget.currency
  return (
    <div className="flex flex-col gap-8">
      <PlanHeader plan={plan} />
      <PracticalInfo plan={plan} />
      <section className="flex flex-col gap-3">
        <div className="text-[12px] font-semibold uppercase tracking-[1.5px] text-text-secondary">
          Itinerary
        </div>
        {plan.days.map((day, idx) => (
          <DayCard key={day.id} day={day} currency={currency} defaultOpen={idx === 0} />
        ))}
      </section>
      <GrandTotal plan={plan} />
    </div>
  )
}
