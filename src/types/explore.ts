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
}

export interface ExploreNeighborhood {
  name: string
  vibe: string
  goodFor: string
}

export interface ExploreFood {
  name: string
  note: string
}

export interface ExploreStay {
  area: string
  tier: 'budget' | 'mid' | 'comfortable' | 'luxury'
  why: string
}

export interface ExploreActivity {
  name: string
  note: string
}

export interface DestinationOverview {
  name: string
  country: string
  kind: ExploreKind
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
