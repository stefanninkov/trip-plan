import { useState } from 'react'
import { ChevronDown, Sparkles, Loader2 } from 'lucide-react'
import type { DayPlan } from '@/types/trip-plan'
import type { TripInputs } from '@/types/wizard'
import type { TripEditor } from '@/hooks/useTripEditor'
import { useRegenerateDay } from '@/hooks/useRegenerateDay'
import { useUiStore } from '@/store/ui-store'
import { Button } from '@/components/shared/Button'
import { cn } from '@/utils/cn'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { EditableText } from '@/components/shared/EditableText'
import { CATEGORIES } from '@/constants/categories'
import { TRAVEL_MODES } from '@/constants/travel-modes'
import { formatDate } from '@/utils/date-helpers'
import { BlockList } from './BlockEditor'
import { CostList } from './CostEditor'
import { HotelList } from './HotelEditor'
import { TipBlock } from './TipBlock'

export interface DayCardProps {
  day: DayPlan
  currency: string
  editor?: TripEditor
  defaultOpen?: boolean
  allDays?: { id: string; dayNumber: number; title: string }[]
  tripInputs?: TripInputs
}

export function DayCard({
  day,
  currency,
  editor,
  defaultOpen = false,
  allDays,
  tripInputs,
}: DayCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const readOnly = !editor
  const { loading: regenerating, run: runRegenerate } = useRegenerateDay()
  const addToast = useUiStore((s) => s.addToast)

  const handleRegenerate = async () => {
    if (!editor || !tripInputs) return
    const ok = window.confirm(
      `Replace Day ${day.dayNumber} with a fresh AI-generated version? This overwrites your current blocks, costs and hotels for this day.`
    )
    if (!ok) return
    const next = await runRegenerate({
      inputs: tripInputs,
      day: { id: day.id, dayNumber: day.dayNumber, date: day.date, location: day.location },
    })
    if (next) {
      editor.replaceDay(day.id, next)
      addToast('success', `Day ${day.dayNumber} regenerated`)
    } else {
      addToast('error', 'Could not regenerate that day')
    }
  }
  // The print CSS forces everything visible regardless of local open state.
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden print:overflow-visible print:break-inside-avoid print:bg-white print:border-neutral-300 day-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 lg:px-5 lg:py-5 hover:bg-bg-elevated transition-colors text-left print:p-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-accent-muted text-accent font-cost font-bold flex items-center justify-center shrink-0">
            {day.dayNumber}
          </div>
          <div className="min-w-0">
            <div className="text-[15px] lg:text-[16px] font-semibold truncate">{day.title}</div>
            <div className="text-[12px] text-text-tertiary">
              {formatDate(day.date)}
              {' \u00B7 '}
              {day.location}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CurrencyDisplay
            min={day.dailyTotal.min}
            max={day.dailyTotal.max}
            currency={currency}
            size="sm"
          />
          <ChevronDown
            size={18}
            className={cn(
              'text-text-tertiary transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </div>
      </button>

      <div
        className={cn(
          'border-t border-border-subtle px-4 lg:px-5 py-5 flex flex-col gap-5 print:!block',
          !open && 'hidden print:!block'
        )}
      >
          {editor && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-3">
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
              </div>
              {tripInputs && (
                <Button
                  variant="secondary"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="self-start flex items-center gap-1.5"
                >
                  {regenerating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  {regenerating ? 'Regenerating\u2026' : 'Regenerate this day with AI'}
                </Button>
              )}
            </div>
          )}

          {editor ? (
            <BlockList
              dayId={day.id}
              blocks={day.blocks}
              editor={editor}
              allDays={allDays}
            />
          ) : (
            <ReadOnlyBlocks blocks={day.blocks} />
          )}

          {editor ? (
            <HotelList
              dayId={day.id}
              hotels={day.hotels}
              editor={editor}
              defaultCurrency={currency}
            />
          ) : (
            day.hotels && day.hotels.length > 0 && <ReadOnlyHotels day={day} />
          )}

          {editor ? (
            <CostList
              dayId={day.id}
              costs={day.costs}
              editor={editor}
              defaultCurrency={currency}
            />
          ) : (
            day.costs.length > 0 && <ReadOnlyCosts day={day} />
          )}

          {readOnly && day.blocks.length === 0 && day.costs.length === 0 && (
            <p className="text-[13px] text-text-tertiary italic">Nothing scheduled yet.</p>
          )}
        </div>
    </div>
  )
}

function ReadOnlyBlocks({ blocks }: { blocks: DayPlan['blocks'] }) {
  if (blocks.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b) => {
        const ModeIcon = b.travelMode ? TRAVEL_MODES[b.travelMode].icon : null
        return (
          <div
            key={b.id}
            className="bg-bg-secondary border border-border-subtle rounded-lg p-3 flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2">
              <span className="font-cost text-[12px] text-text-tertiary">{b.time}</span>
              {ModeIcon && (
                <span className="flex items-center gap-1 text-[11px] text-accent">
                  <ModeIcon size={12} />
                  {b.travelMode && TRAVEL_MODES[b.travelMode].label}
                </span>
              )}
            </div>
            <div className="text-[14px] font-semibold">{b.title}</div>
            <p className="text-[13px] text-text-secondary leading-[20px]">{b.description}</p>
            {b.whyPicked && <TipBlock kind="why" text={b.whyPicked} />}
            {b.historicalContext && <TipBlock kind="history" text={b.historicalContext} />}
            {b.tip && <TipBlock kind="tip" text={b.tip} />}
            {b.warning && <TipBlock kind="warning" text={b.warning} />}
          </div>
        )
      })}
    </div>
  )
}

function ReadOnlyHotels({ day }: { day: DayPlan }) {
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
            <CurrencyDisplay min={h.pricePerNight} currency={h.currency} size="sm" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ReadOnlyCosts({ day }: { day: DayPlan }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[12px] font-semibold uppercase tracking-[1.5px] text-text-secondary">
        Costs
      </div>
      <div className="flex flex-col divide-y divide-border-subtle">
        {day.costs.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 py-2 text-[13px]"
            style={{ borderLeft: `3px solid var(--color-cat-${c.category})`, paddingLeft: 8 }}
          >
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
            <CurrencyDisplay min={c.amount.min} max={c.amount.max} currency={c.currency} size="sm" />
          </div>
        ))}
      </div>
    </div>
  )
}
