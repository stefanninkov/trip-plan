/**
 * Build a Google Maps search URL for a given query + optional location.
 * Works without any API key.
 */
export function googleMapsSearchUrl(query: string, location = ''): string {
  const combined = [query, location].filter((s) => s.trim().length > 0).join(' ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(combined)}`
}
