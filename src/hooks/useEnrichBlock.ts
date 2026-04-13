import { useState, useCallback } from 'react'
import { FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { logger } from '@/utils/logger'

export interface EnrichedBlock {
  description: string
  whyPicked: string
  historicalContext: string | null
  tip: string | null
  warning: string | null
}

interface EnrichArgs {
  block: { title: string; description: string; time: string }
  location?: string
  dayTitle?: string
}

export function useEnrichBlock() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (args: EnrichArgs): Promise<EnrichedBlock | null> => {
    if (!FUNCTIONS_BASE_URL) {
      setError('Backend not configured')
      return null
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${FUNCTIONS_BASE_URL}/enrichBlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { enriched: EnrichedBlock }
      return data.enriched
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Enrichment failed'
      logger.error('useEnrichBlock:', msg)
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, run }
}
