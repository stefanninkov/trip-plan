import type { TripPlan } from '@/types/trip-plan'
import { formatDate } from './date-helpers'
import { formatRange } from './format-currency'

/**
 * Produce a WhatsApp / Telegram friendly plain-text rendering of the plan.
 */
export function planToText(plan: TripPlan): string {
  const lines: string[] = []
  lines.push(`\u2708\uFE0F ${plan.tripTitle}`)
  lines.push('')
  if (plan.summary) {
    lines.push(plan.summary)
    lines.push('')
  }
  lines.push(
    `Budget: ${formatRange(plan.grandTotal.total.min, plan.grandTotal.total.max, plan.totalBudget.currency)}  \u00B7  ${plan.travelers} travelers`
  )
  if (plan.weatherNote) lines.push(`Weather: ${plan.weatherNote}`)
  lines.push('')

  plan.days.forEach((day) => {
    lines.push(
      `\u2501\u2501 Day ${day.dayNumber} \u00B7 ${formatDate(day.date)} \u00B7 ${day.location} \u2501\u2501`
    )
    lines.push(day.title)
    if (day.blocks.length > 0) {
      day.blocks.forEach((b) => {
        lines.push('')
        lines.push(`${b.time}  ${b.title}`)
        if (b.description) lines.push(`  ${b.description}`)
        if (b.tip) lines.push(`  \uD83D\uDCA1 ${b.tip}`)
        if (b.warning) lines.push(`  \u26A0\uFE0F ${b.warning}`)
      })
    }
    if (day.hotels && day.hotels.length > 0) {
      lines.push('')
      lines.push('Hotels:')
      day.hotels.forEach((h) => {
        lines.push(`  \u2022 ${h.name} (${h.tier}) \u2013 ${formatRange(h.pricePerNight, h.pricePerNight, h.currency)}/night`)
      })
    }
    if (day.costs.length > 0) {
      lines.push('')
      lines.push(
        `Daily total: ${formatRange(day.dailyTotal.min, day.dailyTotal.max, plan.totalBudget.currency)}`
      )
    }
    lines.push('')
  })

  lines.push('\u2501\u2501 Budget breakdown \u2501\u2501')
  Object.entries(plan.grandTotal.byCategory).forEach(([cat, amount]) => {
    lines.push(`  ${cat}: ${formatRange(amount.min, amount.max, plan.totalBudget.currency)}`)
  })
  lines.push(
    `  TOTAL: ${formatRange(plan.grandTotal.total.min, plan.grandTotal.total.max, plan.totalBudget.currency)}`
  )

  return lines.join('\n')
}
