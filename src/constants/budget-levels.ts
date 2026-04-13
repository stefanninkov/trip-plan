import type { BudgetTier } from '@/types/trip-plan'

export interface BudgetLevelConfig {
  id: BudgetTier
  label: string
  description: string
}

export const BUDGET_LEVELS: BudgetLevelConfig[] = [
  {
    id: 'budget',
    label: 'Budget',
    description: 'Hostels, street food, free attractions',
  },
  {
    id: 'mid',
    label: 'Mid-range',
    description: '3-star hotels, sit-down meals, paid attractions',
  },
  {
    id: 'comfortable',
    label: 'Comfortable',
    description: '4-star hotels, wine with dinner, taxis when convenient',
  },
]
