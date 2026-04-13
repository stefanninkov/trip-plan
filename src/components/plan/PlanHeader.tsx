import { Sparkles } from 'lucide-react'
import type { TripPlan } from '@/types/trip-plan'
import type { TripEditor } from '@/hooks/useTripEditor'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { EditableText } from '@/components/shared/EditableText'

export interface PlanHeaderProps {
  plan: TripPlan
  editor?: TripEditor
  homeCurrency?: string
}

export function PlanHeader({ plan, editor, homeCurrency }: PlanHeaderProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-text-tertiary text-[12px] uppercase tracking-[1.5px]">
        <Sparkles size={12} className="text-accent" />
        Trip plan
      </div>
      {editor ? (
        <EditableText
          as="h1"
          value={plan.tripTitle}
          onCommit={editor.setTripTitle}
          placeholder="Untitled trip"
        />
      ) : (
        <h1>{plan.tripTitle}</h1>
      )}
      {editor ? (
        <EditableText
          as="p"
          value={plan.summary}
          onCommit={editor.setSummary}
          placeholder="Add a short summary"
          multiline
          className="text-text-secondary max-w-2xl"
        />
      ) : (
        <p className="text-text-secondary max-w-2xl">{plan.summary}</p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4 pt-2 border-t border-border-subtle">
        <div className="text-[13px] text-text-secondary">
          <span className="text-text-primary font-semibold">{plan.days.length} days</span>
          {' · '}
          <span>{plan.travelers} travelers</span>
        </div>
        <CurrencyDisplay
          min={plan.grandTotal.total.min}
          max={plan.grandTotal.total.max}
          currency={plan.totalBudget.currency}
          homeCurrency={homeCurrency}
          size="lg"
        />
      </div>
    </section>
  )
}
