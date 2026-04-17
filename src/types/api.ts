import type { TripInputs } from './wizard'
import type { TripPlan } from './trip-plan'
import type { PackingList } from './packing'

export interface ShareOptions {
  excludeNotes?: boolean
  excludeCosts?: boolean
  /** Preferred viewer language ('en' | 'sr'). Used as fallback if URL lacks ?lang. */
  language?: 'en' | 'sr'
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
  packingList?: PackingList | null
}
