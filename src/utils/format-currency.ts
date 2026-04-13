import { CURRENCY_MAP } from '@/constants/currencies'

export function currencySymbol(currencyCode: string): string {
  return CURRENCY_MAP.get(currencyCode)?.symbol ?? currencyCode
}

/**
 * Format just the number part with thousands separators (no currency).
 * Rounds to the nearest integer for readability.
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
}

/**
 * Single amount with a thin non-breaking space between symbol and number so
 * the currency and the value read as two pieces rather than one jammed token.
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  return `${currencySymbol(currencyCode)} ${formatAmount(amount)}`
}

export function formatRange(min: number, max: number, currencyCode: string): string {
  if (min === max) {
    return formatCurrency(min, currencyCode)
  }
  const sym = currencySymbol(currencyCode)
  return `${sym} ${formatAmount(min)}–${formatAmount(max)}`
}
