import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  fullWidth?: boolean
  children?: ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-bg-primary font-semibold px-5 py-2.5 rounded-lg hover:bg-accent-hover active:opacity-85 disabled:opacity-40 disabled:pointer-events-none transition-opacity duration-100',
  secondary:
    'bg-transparent text-text-primary border border-border-default px-5 py-2.5 rounded-lg font-medium hover:bg-bg-elevated hover:border-border-strong active:opacity-85 disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150',
  ghost:
    'bg-transparent text-text-secondary px-3 py-2 rounded-lg font-medium hover:bg-bg-elevated hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150',
  icon:
    'w-9 h-9 bg-transparent text-text-secondary rounded-lg flex items-center justify-center hover:bg-bg-elevated hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', fullWidth, className, children, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'text-[13px] leading-[18px] tracking-[0.2px]',
        VARIANT_CLASSES[variant],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
