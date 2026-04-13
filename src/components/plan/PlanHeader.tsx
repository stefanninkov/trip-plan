import { Sparkles } from 'lucide-react'
import type { TripPlan } from '@/types/trip-plan'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'

export interface PlanHeaderProps {
  plan: TripPlan
}

export function PlanHeader({ plan }: PlanHeaderProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-text-tertiary text-[12px] uppercase tracking-[1.5px]">
        <Sparkles size={12} className="text-accent" />
        AI-generated trip plan
      </div>
      <h1>{plan.tripTitle}</h1>
      <p className="text-text-secondary max-w-2xl">{plan.summary}</p>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-2 border-t border-border-subtle">
        <div className="text-[13px] text-text-secondary">
          <span className="text-text-primary font-semibold">{plan.days.length} days</span>
          {' \u00B7 '}
          <span>{plan.travelers} travelers</span>
        </div>
        <CurrencyDisplay
          min={plan.totalBudget.min}
          max={plan.totalBudget.max}
          currency={plan.totalBudget.currency}
          size="lg"
        />
      </div>
    </section>
  )
}
