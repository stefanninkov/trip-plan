import type { TripPlan } from '@/types/trip-plan'
import { Card } from '@/components/shared/Card'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { CATEGORIES } from '@/constants/categories'

export interface GrandTotalProps {
  plan: TripPlan
  homeCurrency?: string
}

export function GrandTotal({ plan, homeCurrency }: GrandTotalProps) {
  const currency = plan.totalBudget.currency
  return (
    <Card className="flex flex-col gap-4">
      <div className="text-[12px] font-semibold uppercase tracking-[1.5px] text-text-secondary">
        Budget breakdown
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(plan.grandTotal.byCategory) as Array<keyof typeof plan.grandTotal.byCategory>).map(
          (cat) => {
            const amount = plan.grandTotal.byCategory[cat]
            return (
              <div key={cat} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: `var(--color-cat-${cat})` }}
                  />
                  <span className="text-[12px] text-text-secondary">{CATEGORIES[cat].label}</span>
                </div>
                <CurrencyDisplay
                  min={amount.min}
                  max={amount.max}
                  currency={currency}
                  homeCurrency={homeCurrency}
                  size="md"
                  className="items-start"
                />
              </div>
            )
          }
        )}
      </div>
      <div className="flex items-baseline justify-between pt-3 border-t border-border-subtle">
        <span className="text-[14px] text-text-secondary">Grand total</span>
        <CurrencyDisplay
          min={plan.grandTotal.total.min}
          max={plan.grandTotal.total.max}
          currency={currency}
          homeCurrency={homeCurrency}
          size="lg"
        />
      </div>
    </Card>
  )
}
