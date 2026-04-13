export type ExploreKind = 'city' | 'country' | 'region'

export type HighlightCategory =
  | 'landmark'
  | 'museum'
  | 'nature'
  | 'experience'
  | 'nightlife'
  | 'other'

export interface ExploreHighlight {
  name: string
  why: string
  category: HighlightCategory
  address?: string | null
  mapsQuery?: string | null
  priceHint?: string | null
  duration?: string | null
}

export interface ExploreNeighborhood {
  name: string
  vibe: string
  goodFor: string
  anchors?: string[]
  mapsQuery?: string | null
}

export interface ExploreFood {
  name: string
  note: string
  address?: string | null
  mapsQuery?: string | null
  priceHint?: string | null
}

export interface ExploreStay {
  area: string
  tier: 'budget' | 'mid' | 'comfortable' | 'luxury'
  why: string
  examples?: string[]
  priceHint?: string | null
  mapsQuery?: string | null
}

export interface ExploreActivity {
  name: string
  note: string
  address?: string | null
  mapsQuery?: string | null
  priceHint?: string | null
  duration?: string | null
}

export interface DestinationOverview {
  name: string
  country: string
  kind: ExploreKind
  centerQuery?: string
  summary: string
  bestTimeToVisit: string
  howManyDays: string
  history: string
  highlights: ExploreHighlight[]
  neighborhoods: ExploreNeighborhood[]
  food: ExploreFood[]
  wheretoStay: ExploreStay[]
  activities: ExploreActivity[]
  gettingAround: string
  tips: string[]
  watchouts: string[]
}
