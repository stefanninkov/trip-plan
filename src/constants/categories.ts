import type { CostCategory } from '@/types/trip-plan'

export interface CategoryConfig {
  id: CostCategory
  label: string
  colorVar: string
  bgClass: string
  textClass: string
}

export const CATEGORIES: Record<CostCategory, CategoryConfig> = {
  transport: {
    id: 'transport',
    label: 'Transport',
    colorVar: '--color-cat-transport',
    bgClass: 'bg-cat-transport-muted',
    textClass: 'text-cat-transport',
  },
  hotel: {
    id: 'hotel',
    label: 'Hotel',
    colorVar: '--color-cat-hotel',
    bgClass: 'bg-cat-hotel-muted',
    textClass: 'text-cat-hotel',
  },
  food: {
    id: 'food',
    label: 'Food',
    colorVar: '--color-cat-food',
    bgClass: 'bg-cat-food-muted',
    textClass: 'text-cat-food',
  },
  activity: {
    id: 'activity',
    label: 'Activity',
    colorVar: '--color-cat-activity',
    bgClass: 'bg-cat-activity-muted',
    textClass: 'text-cat-activity',
  },
}

export const CATEGORY_LIST = Object.values(CATEGORIES)
