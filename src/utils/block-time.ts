import type { TimeBlock } from '@/types/trip-plan'

interface Range {
  startMin: number
  endMin: number
}

function parseTime(time: string): Range | null {
  const m = time.match(/^(\d{2}):(\d{2})\s*[-\u2013]\s*(\d{2}):(\d{2})$/)
  if (!m) return null
  const [, sh, sm, eh, em] = m
  const startMin = Number(sh) * 60 + Number(sm)
  let endMin = Number(eh) * 60 + Number(em)
  if (endMin <= startMin) endMin += 24 * 60
  return { startMin, endMin }
}

function format(mins: number): string {
  const wrapped = ((mins % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(wrapped / 60)
  const m = wrapped % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Given the existing blocks for a day, pick the next free time range of
 * `durationMin` minutes starting from 08:00. Falls back to 22:00-23:00 if
 * everything is packed.
 */
export function nextFreeTimeSlot(blocks: TimeBlock[], durationMin = 120): string {
  const ranges = blocks
    .map((b) => parseTime(b.time))
    .filter((r): r is Range => r !== null)
    .sort((a, b) => a.startMin - b.startMin)

  const startOfDay = 8 * 60 // 08:00
  const endOfDay = 22 * 60 // 22:00

  let cursor = startOfDay
  for (const r of ranges) {
    if (r.endMin <= cursor) continue
    if (r.startMin >= cursor + durationMin) {
      return `${format(cursor)}-${format(cursor + durationMin)}`
    }
    cursor = Math.max(cursor, r.endMin)
  }
  if (cursor + durationMin <= endOfDay) {
    return `${format(cursor)}-${format(cursor + durationMin)}`
  }
  // All day packed — return a late slot
  return `${format(endOfDay)}-${format(endOfDay + durationMin)}`
}
