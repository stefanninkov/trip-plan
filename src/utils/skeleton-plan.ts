import type { TripInputs } from '@/types/wizard'
import type { TripPlan, DayPlan, CostRange } from '@/types/trip-plan'
import { daysBetween } from '@/utils/date-helpers'

const EMPTY_RANGE: CostRange = { min: 0, max: 0 }

/**
 * Build an empty TripPlan skeleton from wizard inputs.
 * Distributes nights across destinations and generates a day per night plus
 * a final return-home day when the total adds up.
 */
export function buildSkeletonPlan(inputs: TripInputs): TripPlan {
  const start = new Date(inputs.startDate)
  const totalDays = Math.max(1, daysBetween(inputs.startDate, inputs.endDate) + 1)

  // Flatten destinations into a per-day location array.
  // If total nights < totalDays, fill remaining days with the last destination (or origin).
  const perDayLocations: string[] = []
  for (const dest of inputs.destinations) {
    for (let i = 0; i < dest.nights; i += 1) {
      perDayLocations.push(dest.city)
    }
  }
  while (perDayLocations.length < totalDays) {
    const last = inputs.destinations[inputs.destinations.length - 1]
    perDayLocations.push(last?.city ?? inputs.origin)
  }
  perDayLocations.length = totalDays

  const days: DayPlan[] = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const location = perDayLocations[i]
    return {
      id: `day-${i + 1}`,
      dayNumber: i + 1,
      date: date.toISOString().slice(0, 10),
      title: i === 0 ? 'Arrival' : i === totalDays - 1 ? 'Return home' : `Day in ${location}`,
      location,
      blocks: [],
      costs: [],
      dailyTotal: { ...EMPTY_RANGE },
      hotels: i === totalDays - 1 ? null : [],
    }
  })

  const destList = inputs.destinations.map((d) => d.city).filter(Boolean).join(' \u2192 ')
  const title = destList
    ? `${destList} \u00B7 ${totalDays} days`
    : `Trip starting ${inputs.startDate}`

  return {
    tripTitle: title,
    summary:
      'Empty plan created manually. Click any day to add time blocks, costs and hotel options.',
    totalBudget: { ...EMPTY_RANGE, currency: inputs.homeCurrency || 'EUR' },
    travelers: inputs.travelers,
    bookAhead: [],
    packingTips: [],
    weatherNote: '',
    documentsNeeded: [],
    appsToDownload: [],
    days,
    grandTotal: {
      byCategory: {
        transport: { ...EMPTY_RANGE },
        hotel: { ...EMPTY_RANGE },
        food: { ...EMPTY_RANGE },
        activity: { ...EMPTY_RANGE },
      },
      total: { ...EMPTY_RANGE },
    },
  }
}

/**
 * Recalculate dailyTotal and grandTotal from the current costs.
 * Call after any mutation to keep totals in sync.
 */
export function recalcTotals(plan: TripPlan): TripPlan {
  const categories = ['transport', 'hotel', 'food', 'activity'] as const
  const grandByCategory: Record<(typeof categories)[number], CostRange> = {
    transport: { min: 0, max: 0 },
    hotel: { min: 0, max: 0 },
    food: { min: 0, max: 0 },
    activity: { min: 0, max: 0 },
  }

  const days = plan.days.map((day) => {
    const dailyTotal: CostRange = { min: 0, max: 0 }
    for (const cost of day.costs) {
      dailyTotal.min += cost.amount.min
      dailyTotal.max += cost.amount.max
      grandByCategory[cost.category].min += cost.amount.min
      grandByCategory[cost.category].max += cost.amount.max
    }
    return { ...day, dailyTotal }
  })

  const grandTotal = {
    byCategory: grandByCategory,
    total: {
      min: categories.reduce((sum, c) => sum + grandByCategory[c].min, 0),
      max: categories.reduce((sum, c) => sum + grandByCategory[c].max, 0),
    },
  }

  return { ...plan, days, grandTotal }
}
