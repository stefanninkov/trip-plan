export type CostCategory = 'transport' | 'hotel' | 'food' | 'activity'

export type BudgetTier = 'budget' | 'mid' | 'comfortable'

export interface CostRange {
  min: number
  max: number
}

export interface TimeBlock {
  id: string
  time: string
  title: string
  description: string
  tip: string | null
  warning: string | null
}

export interface CostItem {
  id: string
  item: string
  category: CostCategory
  amount: CostRange
  currency: string
  note: string | null
}

export interface HotelOption {
  name: string
  stars: number
  pricePerNight: number
  currency: string
  highlight: string
  tier: BudgetTier
}

export interface DayPlan {
  id: string
  dayNumber: number
  date: string
  title: string
  location: string
  blocks: TimeBlock[]
  costs: CostItem[]
  dailyTotal: CostRange
  hotels: HotelOption[] | null
}

export interface TripPlan {
  tripTitle: string
  summary: string
  totalBudget: CostRange & { currency: string }
  travelers: number
  bookAhead: string[]
  packingTips: string[]
  weatherNote: string
  documentsNeeded: string[]
  appsToDownload: string[]
  days: DayPlan[]
  grandTotal: {
    byCategory: {
      transport: CostRange
      hotel: CostRange
      food: CostRange
      activity: CostRange
    }
    total: CostRange
  }
}
