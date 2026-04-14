/**
 * Build a keyless Unsplash Source URL for a place query. Returns a
 * deterministic URL that caches well — same query always returns a
 * matched photo (server-side Unsplash pick).
 *
 * Note: Unsplash Source is unauthenticated and has no quota, but the
 * matched photo can vary. We seed with the query so users don't see
 * the image change on re-render.
 */
export function placePhotoUrl(query: string, w = 640, h = 360): string {
  const q = query.trim().toLowerCase().replace(/\s+/g, ',')
  if (!q) return ''
  return `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(q)}`
}

/**
 * Seed-based variant that uses a stable "sig" parameter so each card
 * gets a DIFFERENT image even when the query is identical across a day.
 */
export function placePhotoUrlWithSig(query: string, sig: string, w = 640, h = 360): string {
  const base = placePhotoUrl(query, w, h)
  if (!base) return ''
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}sig=${encodeURIComponent(sig)}`
}
