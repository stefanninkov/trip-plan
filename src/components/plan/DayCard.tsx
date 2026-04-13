import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { DayPlan } from '@/types/trip-plan'
import { cn } from '@/utils/cn'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { Badge } from '@/components/shared/Badge'
import { CATEGORIES } from '@/constants/categories'
import { formatDate } from '@/utils/date-helpers'
import { TipBlock } from './TipBlock'

export interface DayCardProps {
  day: DayPlan
  currency: string
  defaultOpen?: boolean
}

export function DayCard({ day, currency, defaultOpen = false }: DayCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 lg:px-5 lg:py-5 hover:bg-bg-elevated transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-accent-muted text-accent font-cost font-bold flex items-center justify-center shrink-0">
            {day.dayNumber}
          </div>
          <div className="min-w-0 text-left">
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

      {open && (
        <div className="border-t border-border-subtle px-4 lg:px-5 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            {day.blocks.map((b) => (
              <div
                key={b.id}
                className="bg-bg-secondary border border-border-subtle rounded-lg p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-cost text-[12px] text-text-tertiary">{b.time}</span>
                </div>
                <div className="text-[14px] font-semibold">{b.title}</div>
                <p className="text-[13px] text-text-secondary leading-[20px]">{b.description}</p>
                {b.tip && <TipBlock kind="tip" text={b.tip} />}
                {b.warning && <TipBlock kind="warning" text={b.warning} />}
              </div>
            ))}
          </div>

          {day.hotels && day.hotels.length > 0 && (
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
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold truncate">{h.name}</span>
                      <Badge>
                        {h.tier}
                      </Badge>
                    </div>
                    <div className="text-[12px] text-text-tertiary">
                      {h.stars > 0 ? `${h.stars}-star` : 'Hostel'}
                    </div>
                    <p className="text-[12px] text-text-secondary leading-[18px]">{h.highlight}</p>
                    <div className="pt-1 border-t border-border-subtle mt-1">
                      <CurrencyDisplay
                        min={h.pricePerNight}
                        currency={h.currency}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {day.costs.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[12px] font-semibold uppercase tracking-[1.5px] text-text-secondary">
                Costs
              </div>
              <div className="flex flex-col divide-y divide-border-subtle">
                {day.costs.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 py-2 text-[13px]"
                    style={{
                      borderLeft: `3px solid var(--color-cat-${c.category})`,
                      paddingLeft: 8,
                    }}
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
                    <CurrencyDisplay
                      min={c.amount.min}
                      max={c.amount.max}
                      currency={c.currency}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
