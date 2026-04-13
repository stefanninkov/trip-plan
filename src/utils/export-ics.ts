import type { TripPlan, TimeBlock } from '@/types/trip-plan'

/**
 * Build an RFC 5545 .ics calendar file for the whole trip.
 * Each time block becomes one VEVENT. Days with no blocks become an all-day event.
 */
export function planToIcs(plan: TripPlan): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trip Plan//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(plan.tripTitle)}`,
  ]

  const stamp = formatIcsDateTime(new Date())

  plan.days.forEach((day) => {
    if (day.blocks.length === 0) {
      lines.push(...allDayEvent(day.date, day.title, day.location, stamp))
      return
    }
    day.blocks.forEach((block) => {
      const event = buildEvent(day.date, day.location, block, stamp)
      if (event) lines.push(...event)
    })
  })

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

function buildEvent(
  dateIso: string,
  location: string,
  block: TimeBlock,
  stamp: string
): string[] | null {
  const match = block.time.match(/^(\d{2}):(\d{2})\s*[-\u2013]\s*(\d{2}):(\d{2})$/)
  const uid = `${block.id}@trip-plan`
  const summary = block.title || 'Activity'
  const description = block.description || ''

  if (!match) {
    return allDayEvent(dateIso, summary, location, stamp, description, uid)
  }

  const [, sh, sm, eh, em] = match
  const start = new Date(`${dateIso}T${sh}:${sm}:00`)
  const end = new Date(`${dateIso}T${eh}:${em}:00`)
  if (end <= start) end.setDate(end.getDate() + 1)

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatIcsDateTime(start)}`,
    `DTEND:${formatIcsDateTime(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    ...(location ? [`LOCATION:${escapeText(location)}`] : []),
    ...(description ? [`DESCRIPTION:${escapeText(description)}`] : []),
    'END:VEVENT',
  ]
}

function allDayEvent(
  dateIso: string,
  title: string,
  location: string,
  stamp: string,
  description = '',
  uid = `${dateIso}-allday@trip-plan`
): string[] {
  const dt = dateIso.replace(/-/g, '')
  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dt}`,
    `DTEND;VALUE=DATE:${dt}`,
    `SUMMARY:${escapeText(title)}`,
    ...(location ? [`LOCATION:${escapeText(location)}`] : []),
    ...(description ? [`DESCRIPTION:${escapeText(description)}`] : []),
    'END:VEVENT',
  ]
}

function formatIcsDateTime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function downloadIcs(plan: TripPlan): void {
  const ics = planToIcs(plan)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const safeName = plan.tripTitle.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'trip'
  link.download = `${safeName}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
