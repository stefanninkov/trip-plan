import { useState } from 'react'
import { Eye, Pencil } from 'lucide-react'
import type { TripPlan } from '@/types/trip-plan'
import type { TripInputs } from '@/types/wizard'
import { useTripEditor } from '@/hooks/useTripEditor'
import { Button } from '@/components/shared/Button'
import { PlanHeader } from './PlanHeader'
import { PracticalInfo } from './PracticalInfo'
import { DayCard } from './DayCard'
import { GrandTotal } from './GrandTotal'
import { ExportMenu } from './ExportMenu'
import { SearchPanel } from '@/components/search/SearchPanel'

export interface PlanViewProps {
  plan: TripPlan
  tripId: string
  inputs?: TripInputs
  shared?: boolean
  shareToken?: string | null
  readOnly?: boolean
}

export function PlanView({
  plan,
  tripId,
  inputs,
  shared = false,
  shareToken = null,
  readOnly = false,
}: PlanViewProps) {
  const editor = useTripEditor(tripId, plan)
  const [editing, setEditing] = useState(false)
  const current = editor.plan
  const currency = current.totalBudget.currency
  const canEdit = !readOnly && editing

  return (
    <div className="flex flex-col gap-8 print:gap-4">
      {!readOnly && (
        <div className="flex items-center justify-end gap-2 print:hidden">
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
          <ExportMenu
            plan={current}
            tripId={tripId}
            shared={shared}
            shareToken={shareToken}
          />
        </div>
      )}

      <PlanHeader plan={current} editor={canEdit ? editor : undefined} />
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
            editor={canEdit ? editor : undefined}
            defaultOpen={idx === 0}
            tripInputs={canEdit ? inputs : undefined}
            allDays={current.days.map((d) => ({
              id: d.id,
              dayNumber: d.dayNumber,
              title: d.title,
            }))}
          />
        ))}
      </section>
      <GrandTotal plan={current} />
      {!readOnly && (
        <div className="print:hidden">
          <SearchPanel />
        </div>
      )}
    </div>
  )
}
