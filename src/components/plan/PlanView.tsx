import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Wand2, Plus, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { TripPlan } from '@/types/trip-plan'
import type { PackingList } from '@/types/packing'
import type { TripInputs } from '@/types/wizard'
import type { ShareOptions } from '@/types/api'
import { useTripEditor } from '@/hooks/useTripEditor'
import { prefetchRates } from '@/utils/currency-rates'
import { Button } from '@/components/shared/Button'
import { formatDate, relativeDay, todayIso } from '@/utils/date-helpers'
import { ROUTES } from '@/constants/routes'
import { DayNav } from './DayNav'
import { TripCover } from './TripCover'
import { PresenceAvatars } from './PresenceAvatars'
import { RemindersToggle } from './RemindersToggle'
import { TripChat } from './TripChat'
import { TranslateTripButton } from './TranslateTripButton'
import { TranslateBanner } from './TranslateBanner'
import { PlanHeader } from './PlanHeader'
import { PracticalInfo } from './PracticalInfo'
import { DayCard } from './DayCard'
import { GrandTotal } from './GrandTotal'
import { BudgetTracker } from './BudgetTracker'
import { ExportMenu } from './ExportMenu'
import { PackingListPanel } from './PackingListPanel'
import { SearchPanel } from '@/components/search/SearchPanel'

export interface PlanViewProps {
  plan: TripPlan
  tripId: string
  inputs?: TripInputs
  shared?: boolean
  shareToken?: string | null
  shareOptions?: ShareOptions
  readOnly?: boolean
  packingList?: PackingList | null
}

export function PlanView({
  plan,
  tripId,
  inputs,
  shared = false,
  shareToken = null,
  shareOptions,
  readOnly = false,
  packingList,
}: PlanViewProps) {
  const editor = useTripEditor(tripId, plan)

  // Cmd/Ctrl+Z undo, Cmd+Shift+Z redo. Only when an input isn't focused.
  const onShortcut = useCallback(
    (e: KeyboardEvent) => {
      if (readOnly) return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (target && (target as HTMLElement).isContentEditable)
      )
        return
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        editor.undo()
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        editor.redo()
      }
    },
    [editor, readOnly]
  )
  useEffect(() => {
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [onShortcut])
  const [editing, setEditing] = useState(false)
  const current = editor.plan
  const currency = current.totalBudget.currency

  const daySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const dayIds = useMemo(() => current.days.map((d) => d.id), [current.days])
  const handleDayDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = current.days.findIndex((d) => d.id === active.id)
      const newIndex = current.days.findIndex((d) => d.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      editor.reorderDays(oldIndex, newIndex)
    },
    [current.days, editor]
  )
  // Force EUR as the primary display currency so every price (new trips AND
  // historical ones) shows Euro first with the local currency underneath.
  const homeCurrency = 'EUR'
  const canEdit = !readOnly && editing
  const coverLocation = current.days[0]?.location ?? ''

  // Compute which day (if any) is "today" so we can auto-open it when the
  // traveler opens their plan during the trip.
  const today = todayIso()
  const todayIndex = current.days.findIndex((d) => d.date === today)
  const defaultOpenIndex = todayIndex >= 0 ? todayIndex : 0

  // Warm up currency conversion rates once per trip render. We prefetch
  // rates for every distinct currency the plan uses (hotels, costs,
  // totals) because individual cost items may be in different currencies
  // than the top-level totalBudget currency.
  useEffect(() => {
    const seen = new Set<string>()
    const add = (c: string | undefined | null) => {
      if (c && c !== homeCurrency) seen.add(c)
    }
    add(currency)
    current.days.forEach((d) => {
      d.costs.forEach((c) => add(c.currency))
      d.hotels?.forEach((h) => add(h.currency))
    })
    seen.forEach((c) => void prefetchRates(c))
  }, [currency, homeCurrency, current.days])

  // When we land on a trip and today is inside it, scroll the Today day into
  // view after a tick (gives the map / layout time to mount).
  useEffect(() => {
    if (todayIndex < 0) return
    const t = setTimeout(() => {
      const el = document.getElementById(`day-${todayIndex + 1}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 400)
    return () => clearTimeout(t)
  }, [todayIndex])

  const isDuringTrip = current.days.some((d) => relativeDay(d.date) === 'today')

  const firstDate = current.days[0]?.date
  const lastDate = current.days[current.days.length - 1]?.date
  const dateRange =
    firstDate && lastDate
      ? `${formatDate(firstDate)} – ${formatDate(lastDate)}`
      : ''

  return (
    <div className="flex flex-col gap-8 print:gap-4">
      {/* ── Print-only cover page ── */}
      <div className="hidden print-only print-cover" aria-hidden>
        <div className="print-cover-brand">Trip Plan</div>
        <h1>{current.tripTitle}</h1>
        <div className="print-cover-divider" />
        <div className="print-cover-meta">
          {current.days.length} days · {current.travelers} traveler{current.travelers !== 1 ? 's' : ''}
          {dateRange && <> · {dateRange}</>}
        </div>
        {current.summary && (
          <p className="print-cover-summary">{current.summary}</p>
        )}
      </div>

      {/* ── Print-only page footer (repeats every page via position:fixed) ── */}
      <div className="hidden print-only print-footer" aria-hidden>
        Generated by Trip Plan
      </div>

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
            shareOptions={shareOptions}
          />
        </div>
      )}

      {coverLocation && !readOnly && (
        <TripCover location={coverLocation} className="print:hidden" />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <PresenceAvatars tripId={tripId} />
        <div className="flex items-center gap-2 flex-wrap">
          {!readOnly && <TranslateTripButton plan={current} editor={editor} />}
          <RemindersToggle tripId={tripId} plan={current} />
        </div>
      </div>

      {!readOnly && <TranslateBanner plan={current} editor={editor} />}

      <PlanHeader plan={current} editor={canEdit ? editor : undefined} homeCurrency={homeCurrency} />

      {isDuringTrip && (
        <div className="rounded-lg border border-accent bg-accent-muted px-4 py-2 text-[13px] text-text-primary print:hidden">
          You&rsquo;re on your trip right now &mdash; today&rsquo;s day is open below. Check blocks off as you go.
        </div>
      )}

      <PracticalInfo plan={current} />

      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => editor.shiftTripDates(-1)}
            className="flex items-center gap-1.5"
            title="Shift all days back by 1"
          >
            <ChevronsLeft size={14} />
            -1 day
          </Button>
          <Button
            variant="secondary"
            onClick={() => editor.shiftTripDates(1)}
            className="flex items-center gap-1.5"
            title="Shift all days forward by 1"
          >
            +1 day
            <ChevronsRight size={14} />
          </Button>
          <Button
            variant="secondary"
            onClick={() => editor.shiftTripDates(-7)}
            title="Shift all days back by 7"
          >
            -1 week
          </Button>
          <Button variant="secondary" onClick={() => editor.shiftTripDates(7)} title="+7 days">
            +1 week
          </Button>
        </div>
      )}

      <DayNav days={current.days} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-semibold uppercase tracking-[1.5px] text-text-secondary">
            Itinerary
          </div>
          {canEdit && (
            <Button
              variant="secondary"
              onClick={() => editor.addDay()}
              className="flex items-center gap-1.5"
            >
              <Plus size={14} />
              Add day
            </Button>
          )}
        </div>
        {canEdit ? (
          <DndContext sensors={daySensors} collisionDetection={closestCenter} onDragEnd={handleDayDragEnd}>
            <SortableContext items={dayIds} strategy={verticalListSortingStrategy}>
              {current.days.map((day, idx) => (
                <DayCard
                  key={day.id}
                  day={day}
                  currency={currency}
                  homeCurrency={homeCurrency}
                  editor={editor}
                  defaultOpen={idx === defaultOpenIndex}
                  tripInputs={inputs}
                  sortable
                  allDays={current.days.map((d) => ({
                    id: d.id,
                    dayNumber: d.dayNumber,
                    title: d.title,
                  }))}
                  onToggleCompleted={(dayId, blockId) => editor.toggleBlockCompleted(dayId, blockId)}
                  onLogActual={(dayId, costId, actual) => editor.logActual(dayId, costId, actual)}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          current.days.map((day, idx) => (
            <DayCard
              key={day.id}
              day={day}
              currency={currency}
              homeCurrency={homeCurrency}
              defaultOpen={idx === defaultOpenIndex}
              allDays={current.days.map((d) => ({
                id: d.id,
                dayNumber: d.dayNumber,
                title: d.title,
              }))}
              onToggleCompleted={
                readOnly ? undefined : (dayId, blockId) => editor.toggleBlockCompleted(dayId, blockId)
              }
              onLogActual={
                readOnly ? undefined : (dayId, costId, actual) => editor.logActual(dayId, costId, actual)
              }
            />
          ))
        )}
      </section>
      <GrandTotal plan={current} homeCurrency={homeCurrency} />
      <BudgetTracker plan={current} homeCurrency={homeCurrency} />
      <PackingListPanel
        tripId={tripId}
        plan={current}
        packingList={packingList}
        readOnly={readOnly}
      />
      {!readOnly && (
        <div className="print:hidden">
          <SearchPanel
            editor={editor}
            days={current.days}
            currency={currency}
            origin={inputs?.origin}
          />
        </div>
      )}
      {!readOnly && <TripChat plan={current} editor={editor} />}
    </div>
  )
}
