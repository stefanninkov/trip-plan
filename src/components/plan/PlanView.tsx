import { useState, lazy, Suspense } from 'react'
import { Eye, Pencil, Wand2, List, Map as MapIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { TripPlan } from '@/types/trip-plan'
import type { TripInputs } from '@/types/wizard'
import { useTripEditor } from '@/hooks/useTripEditor'
import { Button } from '@/components/shared/Button'
import { CardSkeleton } from '@/components/shared/Skeleton'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'

const TripMap = lazy(() => import('./TripMap').then((m) => ({ default: m.TripMap })))
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

type Tab = 'plan' | 'map'

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
  const [tab, setTab] = useState<Tab>('plan')
  const current = editor.plan
  const currency = current.totalBudget.currency
  const canEdit = !readOnly && editing

  return (
    <div className="flex flex-col gap-8 print:gap-4">
      {!readOnly && (
        <div className="flex items-center justify-end gap-2 print:hidden flex-wrap">
          {editor.isSaving && editing && (
            <span className="text-[12px] text-text-tertiary">Saving&hellip;</span>
          )}
          {inputs && (
            <Link to={`${ROUTES.newTrip}?from=${tripId}`}>
              <Button variant="ghost" className="flex items-center gap-1.5">
                <Wand2 size={14} />
                New trip from inputs
              </Button>
            </Link>
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

      <div className="flex items-center gap-1 border-b border-border-subtle print:hidden">
        <TabButton active={tab === 'plan'} onClick={() => setTab('plan')} icon={List} label="Plan" />
        <TabButton active={tab === 'map'} onClick={() => setTab('map')} icon={MapIcon} label="Map" />
      </div>

      {tab === 'map' ? (
        <Suspense fallback={<CardSkeleton />}>
          <TripMap plan={current} />
        </Suspense>
      ) : (
        <>
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
            onToggleCompleted={
              readOnly ? undefined : (dayId, blockId) => editor.toggleBlockCompleted(dayId, blockId)
            }
          />
        ))}
      </section>
      <GrandTotal plan={current} />
      {!readOnly && (
        <div className="print:hidden">
          <SearchPanel editor={editor} days={current.days} currency={currency} />
        </div>
      )}
        </>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof List
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors',
        active
          ? 'border-accent text-text-primary'
          : 'border-transparent text-text-secondary hover:text-text-primary'
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}
