import { CURRENCY_MAP } from '@/constants/currencies'

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = CURRENCY_MAP.get(currencyCode)
  const symbol = currency?.symbol ?? currencyCode

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))

  return `${symbol}${formatted}`
}

export function formatRange(min: number, max: number, currencyCode: string): string {
  if (min === max) {
    return formatCurrency(min, currencyCode)
  }
  return `${formatCurrency(min, currencyCode)}\u2013${formatCurrency(max, currencyCode)}`
}
