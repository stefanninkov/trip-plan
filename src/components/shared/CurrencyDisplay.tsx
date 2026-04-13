import { cn } from '@/utils/cn'
import { currencySymbol, formatAmount } from '@/utils/format-currency'
import { convertSync } from '@/utils/currency-rates'

export interface CurrencyDisplayProps {
  min: number
  max?: number
  currency: string
  /**
   * Explicit primary display currency. If omitted, defaults to EUR so that
   * every price in the app shows in Euro first and the local currency
   * underneath, regardless of what the user picked for home currency.
   */
  homeCurrency?: string
  /** Optional override (legacy). If omitted, conversion uses the session-cached FX rates. */
  homeRate?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const FORCED_PRIMARY_CURRENCY = 'EUR'

const AMOUNT_CLASSES = {
  sm: 'text-[14px] leading-[18px] font-cost font-semibold tracking-[-0.1px]',
  md: 'text-[16px] leading-[22px] font-cost font-semibold tracking-[-0.2px]',
  lg: 'text-[22px] leading-[28px] font-cost font-bold tracking-[-0.3px]',
}

const SYMBOL_CLASSES = {
  sm: 'text-[10px] leading-[14px] uppercase tracking-[0.4px] font-semibold',
  md: 'text-[11px] leading-[14px] uppercase tracking-[0.5px] font-semibold',
  lg: 'text-[12px] leading-[16px] uppercase tracking-[0.6px] font-semibold',
}

/**
 * Renders a single amount + currency in two parts: a muted pill-ish
 * currency code/symbol and the number itself. Using separate spans (with a
 * gap) stops the symbol from feeling glued to the digits and lets the number
 * own the visual weight.
 */
function AmountRow({
  min,
  max,
  currency,
  muted,
  amountClass,
  symbolClass,
}: {
  min: number
  max?: number
  currency: string
  muted?: boolean
  amountClass: string
  symbolClass: string
}) {
  const sym = currencySymbol(currency)
  const showRange = max !== undefined && Math.round(max) !== Math.round(min)
  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-1.5 whitespace-nowrap',
        muted && 'text-text-tertiary'
      )}
    >
      <span
        className={cn(
          symbolClass,
          muted ? 'text-text-tertiary' : 'text-text-tertiary'
        )}
      >
        {sym}
      </span>
      <span className={amountClass}>
        {formatAmount(min)}
        {showRange && (
          <>
            <span className="mx-0.5 text-text-tertiary font-normal">{'–'}</span>
            {formatAmount(max!)}
          </>
        )}
      </span>
    </span>
  )
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
  // Product decision: always display EUR as the primary currency so prices
  // are immediately legible. Callers can still override by passing an
  // explicit homeCurrency prop, but by default we force EUR.
  const primaryCurrency = homeCurrency ?? FORCED_PRIMARY_CURRENCY

  // Pick conversion rate: explicit homeRate prop -> session FX cache.
  let effectiveRate: number | null = null
  if (primaryCurrency !== currency) {
    if (typeof homeRate === 'number') {
      effectiveRate = homeRate
    } else {
      effectiveRate = convertSync(1, currency, primaryCurrency)
    }
  }

  const homeAvailable = Boolean(effectiveRate && primaryCurrency !== currency)

  // When the user has a home currency that differs from the local one, show
  // the home currency as the primary (big) line and keep the local price as
  // a muted secondary line. This makes budgets readable at a glance.
  return (
    <div className={cn('cost flex flex-col items-end gap-0.5', className)}>
      {homeAvailable && effectiveRate ? (
        <>
          <AmountRow
            min={min * effectiveRate}
            max={max !== undefined ? max * effectiveRate : undefined}
            currency={primaryCurrency}
            amountClass={AMOUNT_CLASSES[size]}
            symbolClass={SYMBOL_CLASSES[size]}
          />
          <span className="text-[11px] leading-[14px] text-text-tertiary inline-flex items-baseline gap-1">
            <span className="text-[10px] uppercase tracking-[0.4px]">{'≈'}</span>
            <AmountRow
              min={min}
              max={max}
              currency={currency}
              muted
              amountClass="text-[11px] leading-[14px] font-cost"
              symbolClass="text-[9px] uppercase tracking-[0.4px] font-semibold"
            />
          </span>
        </>
      ) : (
        <AmountRow
          min={min}
          max={max}
          currency={currency}
          amountClass={AMOUNT_CLASSES[size]}
          symbolClass={SYMBOL_CLASSES[size]}
        />
      )}
    </div>
  )
}
