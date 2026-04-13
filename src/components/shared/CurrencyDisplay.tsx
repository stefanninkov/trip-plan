import { cn } from '@/utils/cn'
import { formatCurrency, formatRange } from '@/utils/format-currency'

export interface CurrencyDisplayProps {
  min: number
  max?: number
  currency: string
  homeCurrency?: string
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

  const showHome = homeCurrency && homeRate && homeCurrency !== currency
  const homePrimary = showHome
    ? max !== undefined && max !== min
      ? formatRange(min * homeRate, max * homeRate, homeCurrency)
      : formatCurrency(min * homeRate, homeCurrency)
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
