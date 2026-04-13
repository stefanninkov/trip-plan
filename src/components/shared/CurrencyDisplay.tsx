import { cn } from '@/utils/cn'
import { formatCurrency, formatRange } from '@/utils/format-currency'
import { convertSync } from '@/utils/currency-rates'

export interface CurrencyDisplayProps {
  min: number
  max?: number
  currency: string
  /** If set and different from `currency`, a converted amount is shown as a secondary line. */
  homeCurrency?: string
  /** Optional override (legacy). If omitted, conversion uses the session-cached FX rates. */
  homeRate?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'text-[13px] leading-[18px]',
  md: 'text-[14px] leading-[22px] font-semibold',
  lg: 'text-[18px] leading-[26px] font-bold tracking-[-0.2px]',
}

export function CurrencyDisplay({
  min,
  max,
  currency,
  homeCurrency,
  homeRate,
  className,
  size = 'md',
}: CurrencyDisplayProps) {
  const primary =
    max !== undefined && max !== min
      ? formatRange(min, max, currency)
      : formatCurrency(min, currency)

  // Pick conversion rate in this order: explicit homeRate prop -> session FX cache.
  let effectiveRate: number | null = null
  if (homeCurrency && homeCurrency !== currency) {
    if (typeof homeRate === 'number') {
      effectiveRate = homeRate
    } else {
      const convertedMin = convertSync(1, currency, homeCurrency)
      effectiveRate = convertedMin
    }
  }

  const showHome = Boolean(homeCurrency && effectiveRate && homeCurrency !== currency)
  const homePrimary =
    showHome && effectiveRate
      ? max !== undefined && max !== min
        ? formatRange(min * effectiveRate, max * effectiveRate, homeCurrency!)
        : formatCurrency(min * effectiveRate, homeCurrency!)
      : null

  return (
    <div className={cn('cost flex flex-col items-end', className)}>
      <span className={SIZE_CLASSES[size]}>{primary}</span>
      {homePrimary && (
        <span className="text-[12px] text-text-tertiary leading-[16px]">
          {'\u2248 '}
          {homePrimary}
        </span>
      )}
    </div>
  )
}
