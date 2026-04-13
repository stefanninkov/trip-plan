import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
  description?: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  options: readonly SelectOption[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, className, id, ...rest },
  ref
) {
  const selectId = id ?? rest.name
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-[13px] font-medium text-text-secondary tracking-[0.2px]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full appearance-none bg-bg-secondary text-text-primary',
            'border border-border-default rounded-lg px-3 py-2.5 pr-9',
            'text-[14px] leading-[22px]',
            'focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-[var(--accent-muted)]',
            'transition-colors duration-150',
            error && 'border-error focus:border-error',
            className
          )}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
        />
      </div>
      {error && <span className="text-[12px] text-error">{error}</span>}
    </div>
  )
})
