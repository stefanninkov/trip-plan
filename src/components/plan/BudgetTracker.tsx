import { useMemo, useState } from 'react'
import { ChevronDown, Receipt } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TripPlan, CostCategory } from '@/types/trip-plan'
import { CATEGORIES } from '@/constants/categories'
import { convertSync } from '@/utils/currency-rates'
import { formatAmount, currencySymbol } from '@/utils/format-currency'
import { cn } from '@/utils/cn'

export interface BudgetTrackerProps {
  plan: TripPlan
  homeCurrency: string
}

interface CategoryStats {
  planned: { min: number; max: number }
  actual: number
}

function toHome(amount: number, from: string, to: string): number {
  if (from === to) return amount
  const rate = convertSync(1, from, to)
  return rate ? amount * rate : amount
}

function computeStats(plan: TripPlan, homeCurrency: string) {
  const byCat: Record<CostCategory, CategoryStats> = {
    transport: { planned: { min: 0, max: 0 }, actual: 0 },
    hotel: { planned: { min: 0, max: 0 }, actual: 0 },
    food: { planned: { min: 0, max: 0 }, actual: 0 },
    activity: { planned: { min: 0, max: 0 }, actual: 0 },
  }
  let totalActual = 0
  let hasAnyActual = false

  for (const day of plan.days) {
    for (const cost of day.costs) {
      const cat = byCat[cost.category]
      if (!cat) continue
      cat.planned.min += toHome(cost.amount.min, cost.currency, homeCurrency)
      cat.planned.max += toHome(cost.amount.max, cost.currency, homeCurrency)
      if (cost.actual != null) {
        hasAnyActual = true
        const a = toHome(cost.actual, cost.currency, homeCurrency)
        cat.actual += a
        totalActual += a
      }
    }
  }

  const totalPlanned = {
    min: Object.values(byCat).reduce((s, c) => s + c.planned.min, 0),
    max: Object.values(byCat).reduce((s, c) => s + c.planned.max, 0),
  }

  return { byCat, totalPlanned, totalActual, hasAnyActual }
}

function variance(actual: number, max: number): 'under' | 'on' | 'over' {
  if (max === 0) return 'on'
  if (actual <= max * 0.95) return 'under'
  if (actual > max * 1.05) return 'over'
  return 'on'
}

const VAR_COLORS = {
  under: 'text-success',
  on: 'text-text-secondary',
  over: 'text-error',
} as const

export function BudgetTracker({ plan, homeCurrency }: BudgetTrackerProps) {
  const { t } = useTranslation()
  const stats = useMemo(() => computeStats(plan, homeCurrency), [plan, homeCurrency])
  const [open, setOpen] = useState(false)
  const sym = currencySymbol(homeCurrency)

  if (!stats.hasAnyActual) return null

  const totalVar = variance(stats.totalActual, stats.totalPlanned.max)

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-5 flex flex-col gap-4 print:border-0 print:p-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-3 w-full text-left"
      >
        <div className="flex items-center gap-2">
          <Receipt size={18} className="text-accent" />
          <h2 className="text-[16px] font-semibold m-0">{t('budget.title')}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('font-cost text-[16px] font-bold', VAR_COLORS[totalVar])}>
            {sym} {formatAmount(stats.totalActual)}
          </span>
          <span className="text-[12px] text-text-tertiary">
            / {sym} {formatAmount(stats.totalPlanned.max)}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              'text-text-tertiary transition-transform',
              open && 'rotate-180'
            )}
          />
        </div>
      </button>

      {open && (
        <div className="flex flex-col gap-3 pt-2 border-t border-border-subtle">
          {(Object.keys(stats.byCat) as CostCategory[]).map((cat) => {
            const s = stats.byCat[cat]
            if (s.planned.max === 0 && s.actual === 0) return null
            const pct = s.planned.max > 0
              ? Math.min(100, Math.round((s.actual / s.planned.max) * 100))
              : 0
            const v = variance(s.actual, s.planned.max)
            return (
              <div key={cat} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: `var(${CATEGORIES[cat].colorVar})` }}
                    />
                    <span className="text-text-secondary">{CATEGORIES[cat].label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-cost">
                    <span className={cn('font-semibold', VAR_COLORS[v])}>
                      {sym} {formatAmount(s.actual)}
                    </span>
                    <span className="text-text-tertiary">
                      / {sym} {formatAmount(s.planned.min)}–{formatAmount(s.planned.max)}
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor:
                        v === 'over'
                          ? 'var(--color-error)'
                          : v === 'under'
                            ? 'var(--color-success)'
                            : `var(${CATEGORIES[cat].colorVar})`,
                    }}
                  />
                </div>
              </div>
            )
          })}

          <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[13px]">
            <span className="text-text-secondary">{t('budget.totalSpent')}</span>
            <div className="flex items-center gap-2 font-cost">
              <span className={cn('text-[16px] font-bold', VAR_COLORS[totalVar])}>
                {sym} {formatAmount(stats.totalActual)}
              </span>
              <span className="text-text-tertiary text-[12px]">
                / {sym} {formatAmount(stats.totalPlanned.min)}–{formatAmount(stats.totalPlanned.max)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
