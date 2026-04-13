type TravelModeInput =
  | 'plane'
  | 'train'
  | 'car'
  | 'bus'
  | 'ferry'
  | 'walk'
  | 'bike'
  | 'subway'
  | 'taxi'
  | 'scooter'

interface TripInputsInput {
  origin: string
  originCountry: string
  destinations: {
    city: string
    country: string
    nights: number
    startDate?: string
    endDate?: string
    arrivalMode?: TravelModeInput
  }[]
  startDate: string
  endDate: string
  travelers: number
  budgetLevel: 'budget' | 'mid' | 'comfortable' | 'luxury'
  interests: string[]
  pace: 'relaxed' | 'moderate' | 'packed'
  accommodationType: string | string[]
  dietaryNeeds: string
  mobilityNotes: string
  homeCurrency: string
  notes: string
}

export function buildUserMessage(inputs: TripInputsInput): string {
  const destList = inputs.destinations
    .map((d) => {
      const dates =
        d.startDate && d.endDate
          ? `, ${d.startDate} to ${d.endDate}`
          : ''
      return `${d.city}${d.country ? `, ${d.country}` : ''} (${d.nights} nights${dates})`
    })
    .join(' -> ')

  const transportLegs = inputs.destinations
    .map((d, i) => {
      if (!d.arrivalMode) return null
      const from = i === 0 ? inputs.origin : inputs.destinations[i - 1].city
      return `  - ${from} -> ${d.city}: ${d.arrivalMode}`
    })
    .filter((x): x is string => x !== null)
    .join('\n')
  const transportSection = transportLegs
    ? `\n- Required transport modes (MUST use these for the inter-city transport blocks):\n${transportLegs}`
    : '\n- Transport modes: pick the best options for each leg.'

  const interests = inputs.interests.length ? inputs.interests.join(', ') : '(none specified)'

  const totalDays =
    Math.round(
      (new Date(inputs.endDate).getTime() - new Date(inputs.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1

  return `Plan a trip with these details:

- Origin: ${inputs.origin}${inputs.originCountry ? ` (${inputs.originCountry})` : ''}
- Destinations: ${destList}${transportSection}
- Dates: ${inputs.startDate} to ${inputs.endDate} (${totalDays} days)
- Travelers: ${inputs.travelers}
- Budget level: ${inputs.budgetLevel}
- Interests: ${interests}
- Pace: ${inputs.pace}
- Accommodation preference: ${inputs.accommodationType}
- Dietary needs: ${inputs.dietaryNeeds || '(none)'}
- Mobility notes: ${inputs.mobilityNotes || '(none)'}
- Home currency (for equivalents): ${inputs.homeCurrency}
- Special notes: ${inputs.notes || '(none)'}

Respond with ONLY a valid JSON object matching the schema defined in the system prompt.`
}
