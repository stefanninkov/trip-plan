export interface FlightResult {
  airline: string
  departure: string
  arrival: string
  duration: string
  stops: number
  price: number
  currency: string
  bookingUrl: string
}

export interface HotelResult {
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

export interface PlaceResult {
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

export interface WebSearchResult {
  title: string
  snippet: string
  url: string
}
