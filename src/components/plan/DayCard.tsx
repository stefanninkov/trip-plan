import { useRef, useState } from 'react'
import { ChevronDown, GripVertical, Sparkles, Loader2, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DayPlan } from '@/types/trip-plan'
import type { TripInputs } from '@/types/wizard'
import type { TripEditor } from '@/hooks/useTripEditor'
import { useRegenerateDay } from '@/hooks/useRegenerateDay'
import { useUiStore } from '@/store/ui-store'
import { Button } from '@/components/shared/Button'
import { cn } from '@/utils/cn'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { currencySymbol } from '@/utils/format-currency'
import { EditableText } from '@/components/shared/EditableText'
import { CATEGORIES } from '@/constants/categories'
import { TRAVEL_MODES } from '@/constants/travel-modes'
import { formatDate, relativeDay } from '@/utils/date-helpers'
import { BlockList } from './BlockEditor'
import { CostList } from './CostEditor'
import { HotelList } from './HotelEditor'
import { BlockMoreInfo } from './BlockMoreInfo'
import { BlockCheckbox } from './BlockCheckbox'
import { DayWeather, DayWeatherNote } from './DayWeather'

export interface DayCardProps {
  day: DayPlan
  currency: string
  homeCurrency?: string
  editor?: TripEditor
  defaultOpen?: boolean
  allDays?: { id: string; dayNumber: number; title: string }[]
  tripInputs?: TripInputs
  /**
   * When provided (and no editor is provided), enables the read-only checkbox
   * so users can still mark blocks done during travel without entering edit mode.
   */
  onToggleCompleted?: (dayId: string, blockId: string) => void
  onLogActual?: (dayId: string, costId: string, actual: number | null) => void
  sortable?: boolean
}

export function DayCard({
  day,
  currency,
  homeCurrency,
  editor,
  defaultOpen = false,
  allDays,
  tripInputs,
  onToggleCompleted,
  onLogActual,
  sortable = false,
}: DayCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef: sortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: day.id, disabled: !sortable })
  const sortableStyle = sortable
    ? { transform: CSS.Transform.toString(transform), transition }
    : undefined

  const [open, setOpen] = useState(defaultOpen)
  const [regenOpen, setRegenOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const readOnly = !editor
  const { loading: regenerating, run: runRegenerate } = useRegenerateDay()
  const addToast = useUiStore((s) => s.addToast)

  const handleRegenerate = async (): Promise<void> => {
    if (!editor || !tripInputs) return
    const next = await runRegenerate({
      inputs: tripInputs,
      day: { id: day.id, dayNumber: day.dayNumber, date: day.date, location: day.location },
      feedback: feedback.trim() || undefined,
    })
    if (next) {
      editor.replaceDay(day.id, next)
      addToast('success', `Day ${day.dayNumber} regenerated`)
      setRegenOpen(false)
      setFeedback('')
    } else {
      addToast('error', 'Could not regenerate that day')
    }
  }
  const completedCount = day.blocks.filter((b) => b.completed).length
  const totalCount = day.blocks.length
  const allDone = totalCount > 0 && completedCount === totalCount
  const rel = relativeDay(day.date)

  const localRef = useRef<HTMLDivElement>(null)
  // The print CSS forces everything visible regardless of local open state.
  return (
    <div
      ref={sortable ? sortableRef : localRef}
      id={`day-${day.dayNumber}`}
      style={sortableStyle}
      className={cn(
        'bg-bg-surface border border-border-subtle rounded-xl overflow-hidden print:overflow-visible print:break-inside-avoid print:bg-white print:border-neutral-300 day-card scroll-mt-24',
        rel === 'past' && 'opacity-70',
        rel === 'today' && 'ring-1 ring-accent',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <div className="flex items-stretch">
        {sortable && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex items-center justify-center w-8 shrink-0 cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated transition-colors print:hidden"
            aria-label="Drag to reorder"
          >
            <GripVertical size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-4 px-4 py-4 lg:px-5 lg:py-5 hover:bg-bg-elevated transition-colors text-left print:p-3"
        >
        {/* Left: day number */}
        <div
          className={cn(
            'w-10 h-10 rounded-full font-cost font-bold flex items-center justify-center shrink-0',
            allDone ? 'bg-success text-bg-primary' : 'bg-accent-muted text-accent'
          )}
          style={
            allDone
              ? { backgroundColor: 'var(--color-success)', color: 'var(--color-bg-primary)' }
              : undefined
          }
        >
          {day.dayNumber}
        </div>

        {/* Middle: title + meta row */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                'text-[15px] lg:text-[16px] font-semibold truncate',
                allDone && 'line-through'
              )}
            >
              {day.title}
            </span>
            {rel === 'today' && (
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-[0.5px] bg-accent-muted text-accent">
                Today
              </span>
            )}
          </div>
          <div className="text-[12px] text-text-tertiary flex items-center gap-2 flex-wrap">
            <span className="truncate">
              {formatDate(day.date)} · {day.location}
            </span>
            {totalCount > 0 && (
              <span className="shrink-0">
                {completedCount}/{totalCount} done
              </span>
            )}
          </div>
        </div>

        {/* Right: compact weather, price, chevron — stacked on mobile */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end gap-1">
            <DayWeather location={day.location} date={day.date} compact />
            <CurrencyDisplay
              min={day.dailyTotal.min}
              max={day.dailyTotal.max}
              currency={currency}
              homeCurrency={homeCurrency}
              size="sm"
            />
          </div>
          <div className="sm:hidden">
            <CurrencyDisplay
              min={day.dailyTotal.min}
              max={day.dailyTotal.max}
              currency={currency}
              homeCurrency={homeCurrency}
              size="sm"
            />
          </div>
          <ChevronDown
            size={18}
            className={cn(
              'text-text-tertiary transition-transform duration-200 shrink-0',
              open && 'rotate-180'
            )}
          />
        </div>
        </button>
      </div>

      <div
        className={cn(
          'border-t border-border-subtle px-4 lg:px-5 py-5 flex flex-col gap-5 print:!block',
          !open && 'hidden print:!block'
        )}
      >
          {editor && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_160px] gap-3">
                <div>
                  <span className="text-[12px] font-semibold uppercase tracking-[1.5px] text-text-secondary">
                    Title
                  </span>
                  <EditableText
                    as="p"
                    className="text-[15px] font-semibold"
                    value={day.title}
                    onCommit={(v) => editor.updateDay(day.id, { title: v })}
                    placeholder="Day title"
                  />
                </div>
                <div>
                  <span className="text-[12px] font-semibold uppercase tracking-[1.5px] text-text-secondary">
                    Location
                  </span>
                  <EditableText
                    as="p"
                    className="text-[14px]"
                    value={day.location}
                    onCommit={(v) => editor.updateDay(day.id, { location: v })}
                    placeholder="City or area"
                  />
                </div>
                <div>
                  <span className="text-[12px] font-semibold uppercase tracking-[1.5px] text-text-secondary">
                    Date
                  </span>
                  <input
                    type="date"
                    value={day.date}
                    onChange={(e) => editor.updateDay(day.id, { date: e.target.value })}
                    className="w-full bg-bg-secondary text-text-primary border border-border-default rounded-md px-2 py-1.5 text-[13px] focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              {tripInputs && (
                <div className="flex flex-col gap-2 self-start w-full md:max-w-lg">
                  {!regenOpen ? (
                    <Button
                      variant="secondary"
                      onClick={() => setRegenOpen(true)}
                      disabled={regenerating}
                      className="flex items-center gap-1.5 self-start"
                    >
                      <Sparkles size={14} />
                      Regenerate this day with AI
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2 bg-bg-secondary border border-border-default rounded-lg p-3">
                      <label className="text-[12px] font-medium text-text-secondary">
                        Any feedback for Claude? (optional)
                      </label>
                      <textarea
                        rows={2}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="e.g. make it more relaxed, less museums, include more local food"
                        className="bg-bg-secondary text-text-primary border border-border-default rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-accent resize-y"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setRegenOpen(false)
                            setFeedback('')
                          }}
                          disabled={regenerating}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleRegenerate}
                          disabled={regenerating}
                          className="flex items-center gap-1.5"
                        >
                          {regenerating ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Sparkles size={14} />
                          )}
                          {regenerating ? 'Regenerating…' : 'Regenerate'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {editor ? (
            <BlockList
              dayId={day.id}
              blocks={day.blocks}
              editor={editor}
              allDays={allDays}
              location={day.location}
              dayTitle={day.title}
            />
          ) : (
            <ReadOnlyBlocks
              blocks={day.blocks}
              location={day.location}
              dayTitle={day.title}
              onToggleCompleted={
                onToggleCompleted ? (_d, blockId) => onToggleCompleted(day.id, blockId) : undefined
              }
            />
          )}

          {editor ? (
            <HotelList
              dayId={day.id}
              hotels={day.hotels}
              editor={editor}
              defaultCurrency={currency}
              homeCurrency={homeCurrency}
            />
          ) : (
            day.hotels && day.hotels.length > 0 && <ReadOnlyHotels day={day} homeCurrency={homeCurrency} />
          )}

          {editor ? (
            <CostList
              dayId={day.id}
              costs={day.costs}
              editor={editor}
              defaultCurrency={currency}
              homeCurrency={homeCurrency}
            />
          ) : (
            day.costs.length > 0 && (
              <ReadOnlyCosts
                day={day}
                homeCurrency={homeCurrency}
                onLogActual={onLogActual ? (costId, val) => onLogActual(day.id, costId, val) : undefined}
              />
            )
          )}

          {readOnly && day.blocks.length === 0 && day.costs.length === 0 && (
            <p className="text-[13px] text-text-tertiary italic">Nothing scheduled yet.</p>
          )}

          {/* Richer weather note with practical advice, at the bottom of the
              expanded day content. */}
          <DayWeatherNote location={day.location} date={day.date} />

          {editor && (
            <div className="flex justify-between pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete Day ${day.dayNumber}? This removes all its blocks, costs and hotels.`
                    )
                  ) {
                    editor.deleteDay(day.id)
                  }
                }}
                className="flex items-center gap-1.5 text-[12px] text-text-tertiary hover:text-error transition-colors"
              >
                <Trash2 size={12} />
                Delete day
              </button>
            </div>
          )}
        </div>
    </div>
  )
}

function ReadOnlyBlocks({
  blocks,
  location,
  dayTitle,
  onToggleCompleted,
}: {
  blocks: DayPlan['blocks']
  location: string
  dayTitle: string
  onToggleCompleted?: (dayId: string, blockId: string) => void
}) {
  if (blocks.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b) => {
        const ModeIcon = b.travelMode ? TRAVEL_MODES[b.travelMode].icon : null
        const done = Boolean(b.completed)
        return (
          <div
            key={b.id}
            className={cn(
              'bg-bg-secondary border border-border-subtle rounded-lg p-3 flex gap-3 transition-opacity',
              done && 'opacity-60'
            )}
            style={{
              borderLeft: b.travelMode
                ? `3px solid var(--color-cat-transport)`
                : `3px solid var(--color-cat-activity)`,
            }}
          >
            {onToggleCompleted && (
              <div className="pt-1">
                <BlockCheckbox
                  completed={done}
                  onToggle={() => onToggleCompleted('_day', b.id)}
                />
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-cost text-[12px] text-text-tertiary">{b.time}</span>
                {ModeIcon && (
                  <span className="flex items-center gap-1 text-[11px] text-accent">
                    <ModeIcon size={12} />
                    {b.travelMode && TRAVEL_MODES[b.travelMode].label}
                  </span>
                )}
              </div>
              <div className={cn('text-[14px] font-semibold', done && 'line-through')}>
                {b.title}
              </div>
              <p className="text-[13px] text-text-secondary leading-[20px]">{b.description}</p>
              <BlockMoreInfo block={b} location={location} dayTitle={dayTitle} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ReadOnlyHotels({ day, homeCurrency }: { day: DayPlan; homeCurrency?: string }) {
  if (!day.hotels) return null
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[12px] font-semibold uppercase tracking-[1.5px] text-text-secondary">
        Hotels
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {day.hotels.map((h, i) => (
          <div
            key={i}
            className="rounded-lg border border-border-subtle bg-bg-secondary p-3 flex flex-col gap-1"
          >
            <span className="text-[13px] font-semibold truncate">{h.name}</span>
            <div className="text-[12px] text-text-tertiary">
              {h.stars > 0 ? `${h.stars}-star` : 'Hostel'}
            </div>
            <p className="text-[12px] text-text-secondary leading-[18px]">{h.highlight}</p>
            <CurrencyDisplay
              min={h.pricePerNight}
              currency={h.currency}
              homeCurrency={homeCurrency}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function ReadOnlyCosts({
  day,
  homeCurrency,
  onLogActual,
}: {
  day: DayPlan
  homeCurrency?: string
  onLogActual?: (costId: string, actual: number | null) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[12px] font-semibold uppercase tracking-[1.5px] text-text-secondary">
        Costs
      </div>
      <div className="flex flex-col divide-y divide-border-subtle">
        {day.costs.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-1 py-2"
            style={{ borderLeft: `3px solid var(--color-cat-${c.category})`, paddingLeft: 8 }}
          >
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate">{c.item}</span>
                <span
                  className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded"
                  style={{
                    color: `var(--color-cat-${c.category})`,
                    backgroundColor: `var(--cat-${c.category}-muted)`,
                  }}
                >
                  {CATEGORIES[c.category].label}
                </span>
              </div>
              <CurrencyDisplay
                min={c.amount.min}
                max={c.amount.max}
                currency={c.currency}
                homeCurrency={homeCurrency}
                size="sm"
              />
            </div>
            {onLogActual && (
              <InlineActual
                actual={c.actual}
                currency={c.currency}
                onChange={(val) => onLogActual(c.id, val)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function InlineActual({
  actual,
  currency,
  onChange,
}: {
  actual: number | null | undefined
  currency: string
  onChange: (val: number | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const sym = CATEGORIES ? currencySymbol(currency) : currency

  if (!editing && actual == null) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-[11px] text-text-tertiary hover:text-accent transition-colors self-start print:hidden"
      >
        + Log actual spend
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-[11px] print:hidden">
      <span className="text-text-tertiary">Actual:</span>
      <span className="text-text-tertiary">{sym}</span>
      <input
        type="number"
        defaultValue={actual ?? ''}
        autoFocus={editing && actual == null}
        onBlur={(e) => {
          const v = Number(e.target.value)
          onChange(v > 0 ? v : null)
          if (!v) setEditing(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        className="w-20 bg-transparent border-b border-border-subtle focus:border-accent text-[12px] font-cost py-0.5 outline-none"
        placeholder="0"
      />
      {actual != null && (
        <span className="font-cost font-semibold text-[12px] text-accent">
          {sym} {Math.round(actual).toLocaleString()}
        </span>
      )}
    </div>
  )
}
