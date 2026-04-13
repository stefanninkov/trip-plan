import type { DayPlan } from '@/types/trip-plan'
import { cn } from '@/utils/cn'
import { relativeDay } from '@/utils/date-helpers'

export interface DayNavProps {
  days: DayPlan[]
}

export function DayNav({ days }: DayNavProps) {
  if (days.length <= 1) return null
  return (
    <div className="sticky top-14 z-20 bg-bg-primary/90 backdrop-blur-md border-b border-border-subtle py-2 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 print:hidden">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-text-tertiary shrink-0 pr-2">
          Jump to
        </span>
        {days.map((d) => {
          const allDone = d.blocks.length > 0 && d.blocks.every((b) => b.completed)
          const rel = relativeDay(d.date)
          return (
            <a
              key={d.id}
              href={`#day-${d.dayNumber}`}
              onClick={(e) => {
                // Use scrollIntoView so the sticky nav offset works nicely
                e.preventDefault()
                const el = document.getElementById(`day-${d.dayNumber}`)
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
              aria-label={`Jump to day ${d.dayNumber}: ${d.title}`}
              title={`Day ${d.dayNumber}: ${d.title}`}
              className={cn(
                'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-cost font-bold transition-colors',
                rel === 'today'
                  ? 'ring-1 ring-accent'
                  : '',
                allDone
                  ? 'bg-success text-bg-primary'
                  : 'bg-bg-elevated text-text-secondary hover:bg-bg-surface hover:text-text-primary'
              )}
              style={
                allDone
                  ? { backgroundColor: 'var(--color-success)', color: 'var(--color-bg-primary)' }
                  : undefined
              }
            >
              {d.dayNumber}
            </a>
          )
        })}
      </div>
    </div>
  )
}
