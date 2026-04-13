import { logger } from './logger'
import type { TripPlan } from '@/types/trip-plan'

const ENABLED_KEY = 'trip-plan.reminders-enabled'
const SHOWN_KEY = 'trip-plan.reminders-shown'

/**
 * Lightweight local reminder system for "today's day" briefings. No push
 * infrastructure required — we schedule setTimeout notifications while the
 * tab is open, and also show an in-app toast if the user hasn't already
 * seen today's reminder.
 */
export function remindersEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(ENABLED_KEY) === '1'
}

export function setRemindersEnabled(on: boolean): void {
  if (typeof localStorage === 'undefined') return
  if (on) localStorage.setItem(ENABLED_KEY, '1')
  else localStorage.removeItem(ENABLED_KEY)
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

function shownToday(tripId: string, dateIso: string): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    const raw = localStorage.getItem(SHOWN_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    return map[`${tripId}|${dateIso}`] === '1'
  } catch {
    return false
  }
}

function markShown(tripId: string, dateIso: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(SHOWN_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    map[`${tripId}|${dateIso}`] === '1'
    map[`${tripId}|${dateIso}`] = '1'
    // Trim old entries (> 400 keys)
    const keys = Object.keys(map)
    if (keys.length > 400) {
      for (const k of keys.slice(0, keys.length - 400)) delete map[k]
    }
    localStorage.setItem(SHOWN_KEY, JSON.stringify(map))
  } catch (err) {
    logger.warn('markShown failed', err)
  }
}

function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Fire a browser notification for today's plan if:
 * - Reminders are enabled by the user
 * - Notification permission is granted
 * - A day in the plan matches today's date
 * - We haven't already shown it today
 *
 * Returns the notification title (for tests / toasts) or null.
 */
export function maybeNotifyToday(
  tripId: string,
  plan: TripPlan,
  opts: { t: (key: string, vars?: Record<string, unknown>) => string }
): string | null {
  if (!remindersEnabled()) return null
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null

  const today = todayIso()
  const day = plan.days.find((d) => d.date === today)
  if (!day) return null
  if (shownToday(tripId, today)) return null

  const title = opts.t('notifications.todayBriefing', {
    day: day.dayNumber,
    title: day.title,
  })
  const body =
    `${day.location} — ${day.blocks.length} block${day.blocks.length === 1 ? '' : 's'}` +
    (day.blocks[0] ? ` · ${day.blocks[0].time} ${day.blocks[0].title}` : '')

  try {
    const n = new Notification(title, { body, tag: `trip-${tripId}-${today}`, silent: false })
    n.onclick = () => {
      window.focus()
      window.location.href = `${window.location.origin}${import.meta.env.BASE_URL}trip/${tripId}`
      n.close()
    }
    markShown(tripId, today)
    return title
  } catch (err) {
    logger.warn('Notification failed', err)
    return null
  }
}
