import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, label, className, id, ...rest },
  ref
) {
  const inputId = id ?? rest.name
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[13px] font-medium text-text-secondary tracking-[0.2px]"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'bg-bg-secondary text-text-primary placeholder:text-text-tertiary',
          'border border-border-default rounded-lg px-3 py-2.5',
          'text-[14px] leading-[22px]',
          'focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-[var(--accent-muted)]',
          'transition-colors duration-150',
          error && 'border-error focus:border-error focus:ring-error/20',
          className
        )}
        {...rest}
      />
      {error && <span className="text-[12px] text-error">{error}</span>}
    </div>
  )
})
