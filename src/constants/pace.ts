import type { SelectOption } from '@/components/shared/Select'
import type { AccommodationPref, PacePreference } from '@/types/wizard'

export const PACE_OPTIONS: SelectOption<PacePreference>[] = [
  { value: 'relaxed', label: 'Relaxed (2–3 activities/day)' },
  { value: 'moderate', label: 'Moderate (3–4 activities/day)' },
  { value: 'packed', label: 'Packed (5+ activities/day)' },
]

export const ACCOMMODATION_OPTIONS: SelectOption<AccommodationPref>[] = [
  { value: 'any', label: 'Any' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'apartment', label: 'Apartment / Airbnb' },
]
