import type { BudgetTier } from './trip-plan'

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
}

export type PacePreference = 'relaxed' | 'moderate' | 'packed'

export type AccommodationPref = 'hostel' | 'hotel' | 'apartment' | 'any'

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
  accommodationType: AccommodationPref
  dietaryNeeds: string
  mobilityNotes: string
  homeCurrency: string
  notes: string
}
