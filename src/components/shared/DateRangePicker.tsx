import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { addDays, daysBetween, todayIso, toIsoDate } from '@/utils/date-helpers'

export interface DateRangePickerProps {
  startDate: string
  endDate: string
  onChange: (start: string, end: string) => void
  /** Inclusive lower bound (ISO date). Dates before this are disabled. */
  minDate?: string
  /** Optional accent label for the title inside the popover. */
  title?: string
  className?: string
  /** Show number-of-nights preset chips inside the popover. */
  showPresets?: boolean
  error?: string
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function formatPretty(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function startOfMonth(iso: string): Date {
  const d = iso ? new Date(iso) : new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/**
 * Build a 6-row x 7-column grid of Date values for the given month, anchored
 * on Monday. Days outside the month are still Date objects so they render
 * greyed-out but preserve grid alignment.
 */
function buildMonthGrid(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  // JS getDay(): 0=Sun, 1=Mon ... shift so 0 = Mon.
  const offset = (first.getDay() + 6) % 7
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - offset)
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    days.push(d)
  }
  return days
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  minDate,
  title,
  className,
  showPresets = true,
  error,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const [anchor, setAnchor] = useState<Date>(() => startOfMonth(startDate || minDate || ''))
  // Tracks which end we'll assign on the next click: 'start' or 'end'.
  const [pickingEnd, setPickingEnd] = useState<boolean>(Boolean(startDate && !endDate))
  const popRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Keep the calendar anchor in sync when caller-provided dates change.
  useEffect(() => {
    if (startDate) setAnchor(startOfMonth(startDate))
  }, [startDate])

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node
      if (popRef.current?.contains(t)) return
      if (triggerRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const grid = useMemo(() => buildMonthGrid(anchor), [anchor])
  const today = todayIso()
  const minIso = minDate ?? ''

  const nights = startDate && endDate ? daysBetween(startDate, endDate) : 0

  const handleDayClick = (iso: string) => {
    if (minIso && iso < minIso) return
    if (!startDate || (pickingEnd === false && !endDate)) {
      onChange(iso, '')
      setPickingEnd(true)
      return
    }
    if (pickingEnd) {
      if (iso < startDate) {
        // User picked an earlier date as "end" — treat it as a new start.
        onChange(iso, '')
        setPickingEnd(true)
      } else if (iso === startDate) {
        // Can't have 0 nights — auto-extend to next day.
        onChange(startDate, addDays(startDate, 1))
        setPickingEnd(false)
        setOpen(false)
      } else {
        onChange(startDate, iso)
        setPickingEnd(false)
        setOpen(false)
      }
      return
    }
    // Both already set — clicking any day resets to start a new range.
    onChange(iso, '')
    setPickingEnd(true)
  }

  const applyPreset = (numNights: number) => {
    const base = startDate || today
    const from = minIso && base < minIso ? minIso : base
    const to = addDays(from, numNights)
    onChange(from, to)
    setPickingEnd(false)
    setAnchor(startOfMonth(from))
  }

  const clear = () => {
    onChange('', '')
    setPickingEnd(false)
  }

  const displayStart = startDate ? formatPretty(startDate) : t('wizard.arrive')
  const displayEnd = endDate ? formatPretty(endDate) : t('wizard.leave')

  const goPrev = () =>
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1))
  const goNext = () =>
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1))

  return (
    <div className={cn('relative flex flex-col gap-1', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'group flex items-stretch rounded-lg border bg-bg-secondary overflow-hidden text-left transition-colors',
          open
            ? 'border-accent ring-[3px] ring-[var(--accent-muted)]'
            : error
              ? 'border-error'
              : 'border-border-default hover:border-border-strong'
        )}
      >
        <span className="flex items-center pl-3 pr-2 text-text-tertiary">
          <CalendarIcon size={14} />
        </span>
        <span className="flex-1 flex items-center">
          <span
            className={cn(
              'flex-1 px-2 py-2.5 text-[13px] leading-[18px] border-r border-border-subtle',
              startDate ? 'text-text-primary font-medium' : 'text-text-tertiary'
            )}
          >
            <span className="block text-[10px] uppercase tracking-[0.8px] text-text-tertiary">
              {t('wizard.arrive')}
            </span>
            <span>{displayStart}</span>
          </span>
          <span
            className={cn(
              'flex-1 px-2 py-2.5 text-[13px] leading-[18px]',
              endDate ? 'text-text-primary font-medium' : 'text-text-tertiary'
            )}
          >
            <span className="block text-[10px] uppercase tracking-[0.8px] text-text-tertiary">
              {t('wizard.leave')}
            </span>
            <span>{displayEnd}</span>
          </span>
        </span>
        <span className="flex items-center px-3 text-[11px] font-cost font-semibold text-text-tertiary bg-bg-elevated/30 border-l border-border-subtle">
          {nights > 0 ? (
            <>
              {nights}
              <span className="ml-1 text-[10px]">n</span>
            </>
          ) : (
            '—'
          )}
        </span>
      </button>
      {error && <span className="text-[12px] text-error">{error}</span>}

      {open && (
        <div
          ref={popRef}
          role="dialog"
          aria-label={title ?? 'Pick dates'}
          className="absolute z-20 top-full left-0 mt-2 w-[320px] max-w-[calc(100vw-32px)] rounded-xl border border-border-default bg-bg-surface shadow-lg p-3 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            {title ? (
              <span className="text-[12px] uppercase tracking-[1px] text-text-tertiary font-semibold">
                {title}
              </span>
            ) : (
              <span className="text-[12px] text-text-tertiary">
                {pickingEnd && startDate
                  ? t('dateRange.pickLeave')
                  : t('dateRange.pickArrive')}
              </span>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('common.close')}
              className="text-text-tertiary hover:text-text-primary p-1"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={goPrev}
              aria-label={t('dateRange.previousMonth')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[13px] font-semibold">
              {t(`months.${anchor.getMonth()}`, { defaultValue: MONTH_NAMES[anchor.getMonth()] })}{' '}
              {anchor.getFullYear()}
            </span>
            <button
              type="button"
              onClick={goNext}
              aria-label={t('dateRange.nextMonth')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-[10px] uppercase tracking-[0.5px] text-text-tertiary">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {grid.map((d, i) => {
              const iso = toIsoDate(d)
              const inMonth = d.getMonth() === anchor.getMonth()
              const isToday = iso === today
              const disabled = Boolean(minIso && iso < minIso)
              const isStart = iso === startDate
              const isEnd = iso === endDate
              const inRange =
                startDate && endDate && iso > startDate && iso < endDate
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDayClick(iso)}
                  className={cn(
                    'relative h-9 rounded-md text-[12px] font-medium transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)]',
                    !inMonth && 'text-text-tertiary/50',
                    inMonth && !disabled && !isStart && !isEnd && !inRange &&
                      'text-text-primary hover:bg-bg-elevated',
                    inRange && 'bg-accent-muted text-accent',
                    (isStart || isEnd) && 'bg-accent text-bg-primary font-bold',
                    disabled && 'opacity-30 cursor-not-allowed',
                    isToday && !isStart && !isEnd && 'ring-1 ring-accent/40'
                  )}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          {showPresets && (
            <div className="flex flex-col gap-2 pt-1 border-t border-border-subtle">
              <span className="text-[10px] uppercase tracking-[0.8px] text-text-tertiary">
                {t('dateRange.quickLength')}
              </span>
              <div className="flex flex-wrap gap-1">
                {[2, 3, 5, 7, 10, 14].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => applyPreset(n)}
                    className="text-[11px] px-2 py-1 rounded-full border border-border-default bg-bg-secondary text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
                  >
                    {t('wizard.nNights', { count: n })}
                  </button>
                ))}
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={clear}
                    className="ml-auto text-[11px] px-2 py-1 rounded-full text-text-tertiary hover:text-error transition-colors"
                  >
                    {t('common.clear')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
