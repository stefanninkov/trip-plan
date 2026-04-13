import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { CostCategory } from '@/types/trip-plan'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  category?: CostCategory
  interactive?: boolean
  children?: ReactNode
}

const CATEGORY_BORDER_VAR: Record<CostCategory, string> = {
  transport: 'var(--color-cat-transport)',
  hotel: 'var(--color-cat-hotel)',
  food: 'var(--color-cat-food)',
  activity: 'var(--color-cat-activity)',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { category, interactive, className, children, style, ...rest },
  ref
) {
  const mergedStyle = category
    ? { borderLeft: `3px solid ${CATEGORY_BORDER_VAR[category]}`, ...style }
    : style

  return (
    <div
      ref={ref}
      className={cn(
        'bg-bg-surface border border-border-subtle rounded-xl p-4 lg:p-5',
        interactive &&
          'hover:bg-bg-elevated hover:border-border-default transition-colors duration-150 cursor-pointer',
        className
      )}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </div>
  )
})
