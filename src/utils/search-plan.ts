import { FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { logger } from '@/utils/logger'
import { daysBetween, addDays } from '@/utils/date-helpers'
import type { TripInputs } from '@/types/wizard'
import type {
  TripPlan,
  DayPlan,
  TimeBlock,
  CostItem,
  HotelOption,
  CostRange,
  BudgetTier,
} from '@/types/trip-plan'

interface HotelResult {
  name: string
  stars: number
  pricePerNight: number
  currency: string
  rating: number
  reviewCount: number
  thumbnailUrl: string
  bookingUrl: string
  highlights: string[]
}

interface PlaceResult {
  name: string
  type: string
  rating: number
  reviewCount: number
  priceLevel: string
  address: string
  thumbnailUrl: string
  mapsUrl: string
  phone: string
  website: string
  hours: string
  openNow: boolean | null
  description: string
}

interface FlightResult {
  airline: string
  departure: string
  arrival: string
  duration: string
  stops: number
  price: number
  currency: string
  bookingUrl: string
}

async function post<T>(endpoint: string, body: unknown): Promise<T | null> {
  if (!FUNCTIONS_BASE_URL) return null
  try {
    const res = await fetch(`${FUNCTIONS_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch (err) {
    logger.warn(`${endpoint} search failed`, err)
    return null
  }
}

// --------- Cost heuristics by tier ---------
const MEAL_PRICES: Record<BudgetTier, { min: number; max: number }> = {
  budget: { min: 10, max: 18 },
  mid: { min: 20, max: 40 },
  comfortable: { min: 45, max: 80 },
  luxury: { min: 100, max: 180 },
}

const TRANSIT_PRICES: Record<BudgetTier, { min: number; max: number }> = {
  budget: { min: 6, max: 12 },
  mid: { min: 10, max: 20 },
  comfortable: { min: 20, max: 40 },
  luxury: { min: 40, max: 80 },
}

/**
 * Build a DayPlan from the first 4 place results for this city on this date.
 * Assigns reasonable morning / lunch / afternoon / dinner time slots.
 */
function buildDayFromPlaces(
  dayNumber: number,
  date: string,
  location: string,
  places: PlaceResult[],
  tier: BudgetTier,
  travelers: number,
  currency: string
): DayPlan {
  const slots = [
    { time: '09:00-11:30', role: 'Morning' },
    { time: '12:30-14:00', role: 'Lunch' },
    { time: '15:00-17:30', role: 'Afternoon' },
    { time: '19:30-21:30', role: 'Dinner' },
  ]

  const blocks: TimeBlock[] = places.slice(0, slots.length).map((p, i) => {
    const isFood = slots[i].role === 'Lunch' || slots[i].role === 'Dinner'
    return {
      id: `block-${dayNumber}-${i + 1}`,
      time: slots[i].time,
      title: p.name,
      description:
        p.description ||
        `${p.type || (isFood ? 'Restaurant' : 'Activity')} — ${p.rating > 0 ? `${p.rating}★` : 'highly rated'}${p.reviewCount ? ` (${p.reviewCount} reviews)` : ''}${p.address ? ` · ${p.address}` : ''}`,
      tip: p.hours || null,
      warning: null,
      whyPicked: null,
      historicalContext: null,
      travelMode: null,
      completed: false,
      placeInfo: {
        address: p.address || null,
        phone: p.phone || null,
        website: p.website || null,
        hours: p.hours || null,
        rating: p.rating || null,
        priceLevel: p.priceLevel || null,
        mapsUrl: p.mapsUrl || null,
        thumbnailUrl: p.thumbnailUrl || null,
      },
    }
  })

  // Estimate costs: 3 meals + transit + activity admission.
  const meals = MEAL_PRICES[tier]
  const transit = TRANSIT_PRICES[tier]
  const costs: CostItem[] = [
    {
      id: `cost-${dayNumber}-meals`,
      item: `Meals (3/day × ${travelers})`,
      category: 'food',
      amount: {
        min: meals.min * 3 * travelers,
        max: meals.max * 3 * travelers,
      },
      currency,
      note: `~${meals.min}–${meals.max} per person per meal`,
    },
    {
      id: `cost-${dayNumber}-transit`,
      item: `Local transit (${travelers} pax)`,
      category: 'transport',
      amount: {
        min: transit.min * travelers,
        max: transit.max * travelers,
      },
      currency,
      note: null,
    },
  ]
  // Activity admission heuristic: assume the morning + afternoon places are
  // ticketed attractions (budget-tier dependent).
  const activityUnit =
    tier === 'luxury' ? { min: 40, max: 90 } : tier === 'comfortable' ? { min: 20, max: 45 } : tier === 'mid' ? { min: 10, max: 25 } : { min: 0, max: 12 }
  costs.push({
    id: `cost-${dayNumber}-activities`,
    item: `Attractions & tickets (${travelers} pax)`,
    category: 'activity',
    amount: {
      min: activityUnit.min * 2 * travelers,
      max: activityUnit.max * 2 * travelers,
    },
    currency,
    note: null,
  })

  const dailyTotal: CostRange = costs.reduce(
    (acc, c) => ({ min: acc.min + c.amount.min, max: acc.max + c.amount.max }),
    { min: 0, max: 0 }
  )

  return {
    id: `day-${dayNumber}`,
    dayNumber,
    date,
    title: blocks[0]?.title ? `Day in ${location}` : `Explore ${location}`,
    location,
    blocks,
    costs,
    dailyTotal,
    hotels: null,
    // Used transitIndex for future per-stop customization; silence unused.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ...({} as object),
  } as DayPlan & { _transitIndex?: number }
}

function buildHotelOptions(
  hotels: HotelResult[],
  tier: BudgetTier
): HotelOption[] {
  // Map top 3 results onto tier-appropriate slots.
  return hotels.slice(0, 3).map((h, i) => {
    const optionTier: BudgetTier =
      i === 0
        ? 'budget'
        : i === 1
          ? tier === 'luxury'
            ? 'comfortable'
            : 'mid'
          : tier === 'luxury'
            ? 'luxury'
            : 'comfortable'
    return {
      name: h.name,
      stars: h.stars || 3,
      pricePerNight: h.pricePerNight || 0,
      currency: h.currency || 'EUR',
      highlight:
        h.highlights.join(' · ') ||
        `${h.rating > 0 ? `${h.rating}★` : 'Well-rated'}${h.reviewCount ? ` · ${h.reviewCount} reviews` : ''}`,
      tier: optionTier,
    }
  })
}

export interface SearchPlanProgress {
  label: string
  pct: number
}

/**
 * Build a TripPlan from real web-search data via the SerpAPI-backed Cloud
 * Functions. Searches hotels + places for each destination, flights for the
 * first/last city, then composes day blocks and costs. No AI involved.
 */
export async function buildTripFromSearch(
  inputs: TripInputs,
  onProgress?: (p: SearchPlanProgress) => void
): Promise<TripPlan> {
  const start = inputs.startDate
  const end = inputs.endDate
  const totalDays = Math.max(1, daysBetween(start, end) + 1)
  const currency = 'EUR'
  const tier = inputs.budgetLevel

  // Compute per-day location array using arrive/leave dates when set,
  // otherwise even split by nights.
  const perDayLocations: string[] = []
  const destStays: { city: string; start: string; end: string; hotels: HotelResult[] }[] = []

  for (let i = 0; i < inputs.destinations.length; i++) {
    const d = inputs.destinations[i]
    const s = d.startDate ?? (i === 0 ? start : '')
    const e = d.endDate ?? ''
    destStays.push({ city: d.city, start: s, end: e, hotels: [] })
  }

  // Populate hotels in parallel.
  onProgress?.({ label: 'Searching hotels for each city', pct: 10 })
  await Promise.all(
    destStays.map(async (stay) => {
      if (!stay.city || !stay.start || !stay.end) return
      const hotelData = await post<{ results: HotelResult[] }>('searchHotels', {
        location: stay.city,
        checkIn: stay.start,
        checkOut: stay.end,
        guests: inputs.travelers,
        currency,
      })
      stay.hotels = hotelData?.results ?? []
    })
  )

  // Day → location mapping.
  for (let dayIdx = 0; dayIdx < totalDays; dayIdx++) {
    const date = addDays(start, dayIdx)
    const stay = destStays.find((s) => s.start && s.end && date >= s.start && date < s.end)
    perDayLocations.push(stay?.city ?? destStays[destStays.length - 1]?.city ?? inputs.origin)
  }

  // Per-city places (one lookup per distinct city covers all days at that city).
  onProgress?.({ label: 'Finding top places & restaurants', pct: 35 })
  const uniqueCities = Array.from(new Set(perDayLocations))
  const placesByCity: Record<string, PlaceResult[]> = {}
  await Promise.all(
    uniqueCities.map(async (city) => {
      const res = await post<{ results: PlaceResult[] }>('searchPlaces', {
        query: 'top things to do and restaurants',
        location: city,
      })
      placesByCity[city] = res?.results ?? []
    })
  )

  // Flights (outbound + return) for the bookAhead note and transport costs.
  onProgress?.({ label: 'Looking up flights', pct: 65 })
  let flightCost: CostRange | null = null
  const flights: FlightResult[] = []
  if (inputs.origin && destStays[0]?.city) {
    const out = await post<{ results: FlightResult[] }>('searchFlights', {
      origin: inputs.origin,
      destination: destStays[0].city,
      date: start,
      returnDate: end,
      travelers: inputs.travelers,
    })
    const rs = out?.results ?? []
    if (rs.length) {
      flights.push(...rs.slice(0, 2))
      const cheapest = rs.reduce((m, f) => (f.price && f.price < m.price ? f : m), rs[0])
      // SerpAPI often returns USD — convert approximately to EUR (1 USD ≈ 0.93 EUR).
      const perPax = cheapest.currency === 'USD' ? cheapest.price * 0.93 : cheapest.price
      const total = perPax * inputs.travelers
      flightCost = { min: Math.round(total * 0.9), max: Math.round(total * 1.2) }
    }
  }

  // Build days.
  onProgress?.({ label: 'Composing day blocks', pct: 85 })
  const days: DayPlan[] = []
  // Track how many days of places we've used per city so we rotate blocks
  // instead of repeating the same 4 every day.
  const cityOffset: Record<string, number> = {}
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(start, i)
    const loc = perDayLocations[i]
    const offset = cityOffset[loc] ?? 0
    cityOffset[loc] = offset + 4
    const placePool = placesByCity[loc] ?? []
    // Rotate through the results as days progress at the same city.
    const slice = [
      ...placePool.slice(offset),
      ...placePool.slice(0, Math.max(0, offset)),
    ].slice(0, 4)

    const day = buildDayFromPlaces(
      i + 1,
      date,
      loc,
      slice,
      tier,
      inputs.travelers,
      currency
    )

    // Attach hotels on arrive-days only.
    const stay = destStays.find((s) => s.start === date)
    if (stay) {
      day.hotels = buildHotelOptions(stay.hotels, tier)
      // Add a hotel cost covering the whole stay, prorated on check-in day.
      const nights = daysBetween(stay.start, stay.end)
      const primary = day.hotels[1] || day.hotels[0]
      if (primary && primary.pricePerNight > 0 && nights > 0) {
        day.costs.push({
          id: `cost-${day.dayNumber}-hotel`,
          item: `${primary.name} × ${nights} night${nights === 1 ? '' : 's'}`,
          category: 'hotel',
          amount: {
            min: primary.pricePerNight * nights * 0.95,
            max: primary.pricePerNight * nights * 1.05,
          },
          currency: primary.currency,
          note: `~${primary.pricePerNight}/night`,
        })
      }
    }

    // Inbound transport block + cost on the first day.
    if (i === 0 && flightCost) {
      const firstFlight = flights[0]
      day.blocks.unshift({
        id: `block-${day.dayNumber}-transport`,
        time: firstFlight ? `${firstFlight.departure}-${firstFlight.arrival}` : '08:00-12:00',
        title: `Fly ${inputs.origin} → ${destStays[0]?.city}`,
        description: firstFlight
          ? `${firstFlight.airline}${firstFlight.stops > 0 ? ` · ${firstFlight.stops} stop${firstFlight.stops > 1 ? 's' : ''}` : ' · direct'} · ${firstFlight.duration}`
          : 'Flight to your first destination.',
        tip: 'Check in online 24h before departure.',
        warning: null,
        whyPicked: null,
        historicalContext: null,
        travelMode: 'plane',
        completed: false,
        placeInfo: null,
      })
      day.costs.push({
        id: `cost-${day.dayNumber}-flights-out`,
        item: `Flights ${inputs.origin} ⇄ ${destStays[0]?.city} (${inputs.travelers} pax)`,
        category: 'transport',
        amount: flightCost,
        currency,
        note: null,
      })
    }

    // Recompute dailyTotal after the extra costs.
    day.dailyTotal = day.costs.reduce(
      (acc, c) => ({ min: acc.min + c.amount.min, max: acc.max + c.amount.max }),
      { min: 0, max: 0 }
    )
    days.push(day)
  }

  // Grand totals.
  const byCategory: Record<
    'transport' | 'hotel' | 'food' | 'activity',
    CostRange
  > = {
    transport: { min: 0, max: 0 },
    hotel: { min: 0, max: 0 },
    food: { min: 0, max: 0 },
    activity: { min: 0, max: 0 },
  }
  days.forEach((d) =>
    d.costs.forEach((c) => {
      byCategory[c.category].min += c.amount.min
      byCategory[c.category].max += c.amount.max
    })
  )
  const grandTotal = {
    byCategory,
    total: {
      min: Object.values(byCategory).reduce((s, r) => s + r.min, 0),
      max: Object.values(byCategory).reduce((s, r) => s + r.max, 0),
    },
  }

  const title =
    destStays.map((s) => s.city).filter(Boolean).join(' → ') +
    ` · ${totalDays} days`

  onProgress?.({ label: 'Finalising', pct: 95 })

  return {
    tripTitle: title || `Trip starting ${start}`,
    summary:
      'Built from real Google search data — hotels, top places and restaurants, flight pricing. Edit any block to fine-tune.',
    totalBudget: { ...grandTotal.total, currency },
    travelers: inputs.travelers,
    bookAhead: flights.length
      ? [`Book flights early — cheapest fare found around €${Math.round(flightCost?.min ?? 0)} for ${inputs.travelers} pax`]
      : [],
    packingTips: [],
    weatherNote: '',
    documentsNeeded: [],
    appsToDownload: [],
    days,
    grandTotal,
  }
}
