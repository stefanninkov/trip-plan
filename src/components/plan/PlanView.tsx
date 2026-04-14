import { useCallback, useEffect, useState, lazy, Suspense } from 'react'
import { Eye, Pencil, Wand2, List, Map as MapIcon, Plus, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { TripPlan } from '@/types/trip-plan'
import type { TripInputs } from '@/types/wizard'
import { useTripEditor } from '@/hooks/useTripEditor'
import { prefetchRates } from '@/utils/currency-rates'
import { Button } from '@/components/shared/Button'
import { CardSkeleton } from '@/components/shared/Skeleton'
import { cn } from '@/utils/cn'
import { relativeDay, todayIso } from '@/utils/date-helpers'
import { ROUTES } from '@/constants/routes'
import { DayNav } from './DayNav'
import { TripCover } from './TripCover'
import { PresenceAvatars } from './PresenceAvatars'
import { RemindersToggle } from './RemindersToggle'
import { TripChat } from './TripChat'

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
  const [tab, setTab] = useState<Tab>('plan')
  const current = editor.plan
  const currency = current.totalBudget.currency
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

      {coverLocation && !readOnly && (
        <TripCover location={coverLocation} className="print:hidden" />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <PresenceAvatars tripId={tripId} />
        <RemindersToggle tripId={tripId} plan={current} />
      </div>

      <PlanHeader plan={current} editor={canEdit ? editor : undefined} homeCurrency={homeCurrency} />

      {isDuringTrip && (
        <div className="rounded-lg border border-accent bg-accent-muted px-4 py-2 text-[13px] text-text-primary print:hidden">
          You&rsquo;re on your trip right now &mdash; today&rsquo;s day is open below. Check blocks off as you go.
        </div>
      )}

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
        {current.days.map((day, idx) => (
          <DayCard
            key={day.id}
            day={day}
            currency={currency}
            homeCurrency={homeCurrency}
            editor={canEdit ? editor : undefined}
            defaultOpen={idx === defaultOpenIndex}
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
      <GrandTotal plan={current} homeCurrency={homeCurrency} />
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
        </>
      )}
      {!readOnly && <TripChat plan={current} editor={editor} />}
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
