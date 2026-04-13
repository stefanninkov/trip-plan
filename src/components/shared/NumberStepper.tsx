import { Minus, Plus } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface NumberStepperProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  label?: string
  suffix?: string
  className?: string
}

export function NumberStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  label,
  suffix,
  className,
}: NumberStepperProps) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <span className="text-[13px] font-medium text-text-secondary tracking-[0.2px]">
          {label}
        </span>
      )}
      <div className="inline-flex items-center gap-2 bg-bg-secondary border border-border-default rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          aria-label="Decrement"
          className="w-9 h-9 flex items-center justify-center rounded-md text-text-secondary hover:bg-bg-elevated hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <Minus size={16} />
        </button>
        <span className="min-w-14 text-center font-cost text-[15px] font-semibold text-text-primary">
          {value}
          {suffix ? ` ${suffix}` : ''}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          aria-label="Increment"
          className="w-9 h-9 flex items-center justify-center rounded-md text-text-secondary hover:bg-bg-elevated hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
