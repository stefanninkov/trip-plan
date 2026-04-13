import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { CostCategory } from '@/types/trip-plan'
import { CATEGORIES } from '@/constants/categories'

export interface BadgeProps {
  category?: CostCategory
  className?: string
  children: ReactNode
}

const CATEGORY_STYLES: Record<CostCategory, { bg: string; color: string }> = {
  transport: { bg: 'var(--cat-transport-muted)', color: 'var(--color-cat-transport)' },
  hotel: { bg: 'var(--cat-hotel-muted)', color: 'var(--color-cat-hotel)' },
  food: { bg: 'var(--cat-food-muted)', color: 'var(--color-cat-food)' },
  activity: { bg: 'var(--cat-activity-muted)', color: 'var(--color-cat-activity)' },
}

export function Badge({ category, className, children }: BadgeProps) {
  const style = category
    ? { backgroundColor: CATEGORY_STYLES[category].bg, color: CATEGORY_STYLES[category].color }
    : undefined

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-md',
        'text-[11px] font-semibold uppercase tracking-[0.5px]',
        !category && 'bg-bg-elevated text-text-secondary',
        className
      )}
      style={style}
    >
      {category ? CATEGORIES[category].label : children}
      {category && <span className="sr-only">{children}</span>}
    </span>
  )
}
