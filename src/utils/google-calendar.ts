import type { TripPlan } from '@/types/trip-plan'
import { logger } from './logger'

interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
  error?: string
  error_description?: string
}

interface GoogleTokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void
}

interface GoogleIdentityNamespace {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string
        scope: string
        callback: (response: GoogleTokenResponse) => void
        error_callback?: (err: unknown) => void
      }) => GoogleTokenClient
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentityNamespace
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
const GIS_SRC = 'https://accounts.google.com/gsi/client'
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

export function hasGoogleClientId(): boolean {
  return Boolean(CLIENT_ID)
}

let gisLoad: Promise<void> | null = null
function loadGis(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gisLoad) return gisLoad
  gisLoad = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')))
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
  return gisLoad
}

/** Prompt the user for a Google OAuth access token with calendar scope. */
export async function getCalendarAccessToken(): Promise<string> {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID is not set')
  await loadGis()
  const google = window.google
  if (!google) throw new Error('Google Identity Services unavailable')

  return new Promise<string>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: CALENDAR_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error))
          return
        }
        resolve(response.access_token)
      },
      error_callback: (err) => {
        logger.error('GIS error:', err)
        reject(new Error('Google sign-in was cancelled'))
      },
    })
    client.requestAccessToken({ prompt: 'consent' })
  })
}

interface CalendarEventBody {
  summary: string
  description?: string
  location?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
}

async function insertEvent(
  accessToken: string,
  body: CalendarEventBody
): Promise<void> {
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`)
  }
}

export interface PushToCalendarResult {
  created: number
  skipped: number
}

/**
 * Push every time block in the plan as an event on the user's primary Google
 * Calendar. Each block becomes one timed event. Blocks with no time range
 * are skipped (no useful start/end).
 */
export async function pushPlanToGoogleCalendar(
  plan: TripPlan,
  accessToken: string
): Promise<PushToCalendarResult> {
  let created = 0
  let skipped = 0
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  for (const day of plan.days) {
    if (day.blocks.length === 0) {
      // All-day event for the day itself
      await insertEvent(accessToken, {
        summary: `${plan.tripTitle} · Day ${day.dayNumber}: ${day.title}`,
        description: day.location,
        location: day.location,
        start: { date: day.date },
        end: { date: day.date },
      })
      created += 1
      continue
    }
    for (const b of day.blocks) {
      const match = b.time.match(/^(\d{2}):(\d{2})\s*[-–]\s*(\d{2}):(\d{2})$/)
      if (!match) {
        skipped += 1
        continue
      }
      const [, sh, sm, eh, em] = match
      const startIso = `${day.date}T${sh}:${sm}:00`
      const endIso = `${day.date}T${eh}:${em}:00`
      const description = [
        b.description,
        b.whyPicked ? `\nWhy: ${b.whyPicked}` : '',
        b.historicalContext ? `\nContext: ${b.historicalContext}` : '',
        b.tip ? `\nTip: ${b.tip}` : '',
        b.warning ? `\nHeads up: ${b.warning}` : '',
      ]
        .join('')
        .trim()
      try {
        await insertEvent(accessToken, {
          summary: `${b.title} · ${plan.tripTitle}`,
          description,
          location: day.location,
          start: { dateTime: startIso, timeZone: tz },
          end: { dateTime: endIso, timeZone: tz },
        })
        created += 1
      } catch (err) {
        logger.error('Failed to insert event', err)
        skipped += 1
      }
    }
  }
  return { created, skipped }
}
