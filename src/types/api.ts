import type { TripInputs } from './wizard'
import type { TripPlan } from './trip-plan'

export interface ShareOptions {
  excludeNotes?: boolean
  excludeCosts?: boolean
}

export interface TripDocument {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
  inputs: TripInputs
  plan: TripPlan | null
  status: 'generating' | 'complete' | 'error'
  shared: boolean
  shareToken: string | null
  shareOptions?: ShareOptions
}
