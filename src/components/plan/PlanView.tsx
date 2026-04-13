import { useState } from 'react'
import { Eye, Pencil } from 'lucide-react'
import type { TripPlan } from '@/types/trip-plan'
import { useTripEditor } from '@/hooks/useTripEditor'
import { Button } from '@/components/shared/Button'
import { PlanHeader } from './PlanHeader'
import { PracticalInfo } from './PracticalInfo'
import { DayCard } from './DayCard'
import { GrandTotal } from './GrandTotal'

export interface PlanViewProps {
  plan: TripPlan
  tripId: string
}

export function PlanView({ plan, tripId }: PlanViewProps) {
  const editor = useTripEditor(tripId, plan)
  const [editing, setEditing] = useState(false)
  const current = editor.plan
  const currency = current.totalBudget.currency

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-end gap-2">
        {editor.isSaving && editing && (
          <span className="text-[12px] text-text-tertiary">Saving&hellip;</span>
        )}
        <Button
          variant="secondary"
          onClick={() => setEditing((e) => !e)}
          className="flex items-center gap-1.5"
        >
          {editing ? (
            <>
              <Eye size={14} />
              Preview
            </>
          ) : (
            <>
              <Pencil size={14} />
              Edit
            </>
          )}
        </Button>
      </div>

      <PlanHeader plan={current} editor={editing ? editor : undefined} />
      <PracticalInfo plan={current} />
      <section className="flex flex-col gap-3">
        <div className="text-[12px] font-semibold uppercase tracking-[1.5px] text-text-secondary">
          Itinerary
        </div>
        {current.days.map((day, idx) => (
          <DayCard
            key={day.id}
            day={day}
            currency={currency}
            editor={editing ? editor : undefined}
            defaultOpen={idx === 0}
          />
        ))}
      </section>
      <GrandTotal plan={current} />
    </div>
  )
}
