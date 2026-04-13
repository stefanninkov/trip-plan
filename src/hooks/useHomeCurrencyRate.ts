import { useEffect, useState } from 'react'
import { prefetchRates, convertSync } from '@/utils/currency-rates'

/**
 * Ensures rates for `from -> to` are cached and returns a sync converter.
 * Returns null while rates are loading.
 */
export function useHomeCurrencyRate(from: string, to: string) {
  const [, force] = useState(0)

  useEffect(() => {
    if (!from || !to || from === to) return
    let cancelled = false
    void prefetchRates(from).then(() => {
      if (!cancelled) force((n) => n + 1)
    })
    return () => {
      cancelled = true
    }
  }, [from, to])

  return (amount: number): number | null => convertSync(amount, from, to)
}
