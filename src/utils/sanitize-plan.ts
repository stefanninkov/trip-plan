import type { TripPlan, CostRange } from '@/types/trip-plan'
import type { ShareOptions } from '@/types/api'

const ZERO: CostRange = { min: 0, max: 0 }

/**
 * Return a plan copy with private fields stripped per the share options.
 * Does not mutate the original plan.
 */
export function applyShareOptions(plan: TripPlan, opts: ShareOptions | undefined): TripPlan {
  if (!opts || (!opts.excludeNotes && !opts.excludeCosts)) return plan

  const days = plan.days.map((day) => ({
    ...day,
    costs: opts.excludeCosts ? [] : day.costs,
    dailyTotal: opts.excludeCosts ? ZERO : day.dailyTotal,
    blocks: opts.excludeNotes
      ? day.blocks.map((b) => ({
          ...b,
          tip: null,
          warning: null,
          whyPicked: null,
          historicalContext: null,
        }))
      : day.blocks,
  }))

  return {
    ...plan,
    days,
    totalBudget: opts.excludeCosts ? { ...plan.totalBudget, min: 0, max: 0 } : plan.totalBudget,
    grandTotal: opts.excludeCosts
      ? {
          byCategory: {
            transport: ZERO,
            hotel: ZERO,
            food: ZERO,
            activity: ZERO,
          },
          total: ZERO,
        }
      : plan.grandTotal,
  }
}
