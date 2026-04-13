import { onRequest, type Request } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import type { Response } from 'express'
import { getJson } from 'serpapi'

const SERPAPI_KEY = defineSecret('SERPAPI_KEY')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

function applyCors(res: Response) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
}

async function handlePost<T>(
  req: Request,
  res: Response,
  run: (body: Record<string, unknown>) => Promise<T>
): Promise<void> {
  applyCors(res)
  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const data = await run((req.body ?? {}) as Record<string, unknown>)
    res.status(200).json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('search error:', msg)
    res.status(500).json({ error: msg })
  }
}

// -------- Flights --------
export const searchFlights = onRequest(
  { secrets: [SERPAPI_KEY], region: 'europe-west1', timeoutSeconds: 60 },
  async (req, res) =>
    handlePost(req, res, async (body) => {
      const params = {
        engine: 'google_flights',
        api_key: SERPAPI_KEY.value(),
        departure_id: body.origin,
        arrival_id: body.destination,
        outbound_date: body.date,
        return_date: body.returnDate,
        type: body.returnDate ? '1' : '2',
        adults: body.travelers ?? 1,
        hl: 'en',
      }
      const data = await getJson(params)
      const flights = [
        ...((data.best_flights as unknown[]) ?? []),
        ...((data.other_flights as unknown[]) ?? []),
      ]
      const results = flights.slice(0, 8).map((f) => {
        const flight = f as Record<string, unknown>
        const legs = (flight.flights as Record<string, unknown>[]) ?? []
        const first = legs[0] ?? {}
        const last = legs[legs.length - 1] ?? {}
        return {
          airline: (first.airline as string) ?? 'Unknown',
          departure:
            ((first.departure_airport as Record<string, unknown>)?.time as string) ?? '',
          arrival: ((last.arrival_airport as Record<string, unknown>)?.time as string) ?? '',
          duration: (flight.total_duration as number | undefined)
            ? `${Math.floor((flight.total_duration as number) / 60)}h ${(flight.total_duration as number) % 60}m`
            : '',
          stops: Math.max(0, legs.length - 1),
          price: (flight.price as number) ?? 0,
          currency: 'USD',
          bookingUrl: (flight.booking_token as string) ?? '',
        }
      })
      return { results }
    })
)

// -------- Hotels --------
export const searchHotels = onRequest(
  { secrets: [SERPAPI_KEY], region: 'europe-west1', timeoutSeconds: 60 },
  async (req, res) =>
    handlePost(req, res, async (body) => {
      const params = {
        engine: 'google_hotels',
        api_key: SERPAPI_KEY.value(),
        q: body.location,
        check_in_date: body.checkIn,
        check_out_date: body.checkOut,
        adults: body.guests ?? 1,
        currency: (body.currency as string) ?? 'EUR',
        hl: 'en',
      }
      const data = await getJson(params)
      const properties = ((data.properties as unknown[]) ?? []).slice(0, 10)
      const results = properties.map((p) => {
        const h = p as Record<string, unknown>
        const rate = h.rate_per_night as Record<string, unknown> | undefined
        return {
          name: (h.name as string) ?? 'Unknown',
          stars: (h.hotel_class as number) ?? 0,
          pricePerNight: (rate?.extracted_lowest as number) ?? 0,
          currency: (rate?.currency as string) ?? 'EUR',
          rating: (h.overall_rating as number) ?? 0,
          reviewCount: (h.reviews as number) ?? 0,
          thumbnailUrl:
            (((h.images as Record<string, unknown>[])?.[0]?.thumbnail as string) ??
              (h.thumbnail as string)) ||
            '',
          bookingUrl: (h.link as string) ?? '',
          highlights: ((h.amenities as string[]) ?? []).slice(0, 3),
        }
      })
      return { results }
    })
)

// -------- Places (restaurants, attractions) --------
export const searchPlaces = onRequest(
  { secrets: [SERPAPI_KEY], region: 'europe-west1', timeoutSeconds: 60 },
  async (req, res) =>
    handlePost(req, res, async (body) => {
      const q = `${body.query} ${body.location ?? ''}`.trim()
      const params = {
        engine: 'google_maps',
        api_key: SERPAPI_KEY.value(),
        q,
        type: 'search',
        hl: 'en',
      }
      const data = await getJson(params)
      const local = (data.local_results as unknown[]) ?? []
      const results = local.slice(0, 10).map((p) => {
        const place = p as Record<string, unknown>
        const hoursInfo = place.hours as Record<string, unknown> | string | undefined
        const operatingHours = place.operating_hours as Record<string, string> | undefined
        let hoursStr = ''
        if (typeof hoursInfo === 'string') hoursStr = hoursInfo
        else if (operatingHours) {
          // Build a compact "Mon 09:00-18:00 \u00B7 Tue 09:00-18:00" style string
          hoursStr = Object.entries(operatingHours)
            .slice(0, 7)
            .map(([day, times]) => `${day.slice(0, 3)} ${times}`)
            .join(' \u00B7 ')
        }
        const openNow =
          typeof hoursInfo === 'object' && hoursInfo !== null && 'open' in hoursInfo
            ? Boolean((hoursInfo as Record<string, unknown>).open)
            : null
        return {
          name: (place.title as string) ?? '',
          type: (place.type as string) ?? (((place.types as string[]) ?? [])[0] ?? ''),
          rating: (place.rating as number) ?? 0,
          reviewCount: (place.reviews as number) ?? 0,
          priceLevel: (place.price as string) ?? '',
          address: (place.address as string) ?? '',
          thumbnailUrl: (place.thumbnail as string) ?? '',
          mapsUrl:
            (place.place_id
              ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
              : (place.link as string)) ?? '',
          phone: (place.phone as string) ?? '',
          website: (place.website as string) ?? '',
          hours: hoursStr,
          openNow,
          description: (place.description as string) ?? (place.snippet as string) ?? '',
        }
      })
      return { results }
    })
)

// -------- Web search --------
export const searchWeb = onRequest(
  { secrets: [SERPAPI_KEY], region: 'europe-west1', timeoutSeconds: 60 },
  async (req, res) =>
    handlePost(req, res, async (body) => {
      const params = {
        engine: 'google',
        api_key: SERPAPI_KEY.value(),
        q: body.query,
        hl: 'en',
        num: 10,
      }
      const data = await getJson(params)
      const organic = (data.organic_results as unknown[]) ?? []
      const results = organic.slice(0, 10).map((r) => {
        const item = r as Record<string, unknown>
        return {
          title: (item.title as string) ?? '',
          snippet: (item.snippet as string) ?? '',
          url: (item.link as string) ?? '',
        }
      })
      return { results }
    })
)
