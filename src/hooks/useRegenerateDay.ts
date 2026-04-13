import { useState, useCallback } from 'react'
import { FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { logger } from '@/utils/logger'
import type { TripInputs } from '@/types/wizard'
import type { DayPlan } from '@/types/trip-plan'

interface RegenArgs {
  inputs: TripInputs
  day: { id: string; dayNumber: number; date: string; location: string }
  instructions?: string
}

export function useRegenerateDay() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (args: RegenArgs): Promise<DayPlan | null> => {
    if (!FUNCTIONS_BASE_URL) {
      setError('Backend not configured')
      return null
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${FUNCTIONS_BASE_URL}/regenerateDay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { day: DayPlan }
      return data.day
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Regeneration failed'
      logger.error('useRegenerateDay:', msg)
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, run }
}
