import type { BudgetTier, TravelMode } from './trip-plan'

export type WizardStep =
  | 'origin'
  | 'destinations'
  | 'dates'
  | 'travelers'
  | 'advanced'

export interface Destination {
  city: string
  country: string
  nights: number
  // Optional precise date range per stop (within the overall trip range)
  startDate?: string
  endDate?: string
  /**
   * How the traveler arrives at this stop from the previous location
   * (or from the origin for the first stop). Optional \u2014 when omitted the
   * AI picks the best option.
   */
  arrivalMode?: TravelMode
}

export type PacePreference = 'relaxed' | 'moderate' | 'packed'

export type AccommodationPref =
  | 'hostel'
  | 'hotel'
  | 'apartment'
  | 'villa'
  | 'house'
  | 'bnb'
  | 'resort'
  | 'any'

export interface TripInputs {
  origin: string
  originCountry: string
  destinations: Destination[]
  startDate: string
  endDate: string
  travelers: number
  budgetLevel: BudgetTier
  interests: string[]
  pace: PacePreference
  accommodationType: AccommodationPref | AccommodationPref[]
  dietaryNeeds: string
  mobilityNotes: string
  homeCurrency: string
  notes: string
}
