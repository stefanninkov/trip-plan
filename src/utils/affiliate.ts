/**
 * Wrap an outbound booking URL with affiliate tracking parameters when
 * a matching partner ID is configured via Vite env. Zero-config safe:
 * if no env is set, returns the URL untouched so nothing silently
 * breaks in development.
 *
 * Configure via `.env`:
 *   VITE_AFF_BOOKING=your-booking-aid
 *   VITE_AFF_SKYSCANNER=your-skyscanner-associate-id
 *   VITE_AFF_GETYOURGUIDE=your-getyourguide-partner-id
 */
function env(key: string): string | undefined {
  const v = (import.meta.env as Record<string, string | undefined>)[key]
  return v && v.trim() ? v.trim() : undefined
}

export function withAffiliate(url: string | null | undefined): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()

    if (host.includes('booking.com')) {
      const aid = env('VITE_AFF_BOOKING')
      if (aid && !u.searchParams.has('aid')) u.searchParams.set('aid', aid)
      u.searchParams.set('label', 'trip-plan')
    } else if (host.includes('skyscanner.')) {
      const id = env('VITE_AFF_SKYSCANNER')
      if (id && !u.searchParams.has('associateid'))
        u.searchParams.set('associateid', id)
    } else if (host.includes('getyourguide.')) {
      const pid = env('VITE_AFF_GETYOURGUIDE')
      if (pid && !u.searchParams.has('partner_id'))
        u.searchParams.set('partner_id', pid)
    } else if (host.includes('viator.com')) {
      const pmc = env('VITE_AFF_VIATOR')
      if (pmc && !u.searchParams.has('pid')) u.searchParams.set('pid', pmc)
    }
    // Always add a UTM so you can measure outbound traffic in analytics
    // even before affiliate IDs are configured.
    if (!u.searchParams.has('utm_source')) {
      u.searchParams.set('utm_source', 'trip-plan')
    }
    return u.toString()
  } catch {
    return url
  }
}
