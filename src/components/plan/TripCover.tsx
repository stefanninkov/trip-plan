import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { geocodeDetailed } from '@/utils/geocode'
import { cn } from '@/utils/cn'

const TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

export interface TripCoverProps {
  location: string
  className?: string
}

/**
 * Hash a string to a stable hue so every location gets its own signature
 * cover gradient even when we can't render a real map image.
 */
function hashHue(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h) % 360
}

/**
 * Render a cover banner for the trip. Uses the Mapbox Static Images API
 * when we have a token AND can resolve coords for the location. Falls back
 * to a stylized gradient + location text so there\u2019s always something
 * visual at the top of the trip.
 */
export function TripCover({ location, className }: TripCoverProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
    setUrl(null)
    if (!TOKEN || !location) return
    let cancelled = false
    void geocodeDetailed(location).then((r) => {
      if (cancelled || !r.coord) return
      const w = 1200
      const h = 300
      const zoom = 11
      const src = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${r.coord.lng},${r.coord.lat},${zoom},0/${w}x${h}@2x?access_token=${TOKEN}&logo=false&attribution=false`
      setUrl(src)
    })
    return () => {
      cancelled = true
    }
  }, [location])

  const hue = hashHue(location || 'trip')
  const gradient = `linear-gradient(135deg, hsl(${hue}, 45%, 22%) 0%, hsl(${(hue + 40) % 360}, 55%, 14%) 60%, hsl(${(hue + 80) % 360}, 40%, 10%) 100%)`

  return (
    <div
      className={cn(
        'relative w-full rounded-xl overflow-hidden border border-border-subtle',
        className
      )}
      style={{ aspectRatio: '4 / 1', background: gradient }}
    >
      {url && !failed && (
        <img
          src={url}
          alt={location}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {/* Stylised label \u2014 always visible over the gradient, fades behind
          the real image once it loads. */}
      {(!loaded || failed) && (
        <div className="absolute inset-0 flex items-end p-5">
          <div className="flex items-center gap-2 text-white/80">
            <MapPin size={16} />
            <span className="text-[13px] uppercase tracking-[2px] font-semibold">
              {location}
            </span>
          </div>
        </div>
      )}

      {/* Bottom fade so the page content below reads well against the image
          or the gradient. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, var(--color-bg-primary) 0%, rgba(26,26,30,0.3) 50%, transparent 100%)',
        }}
      />
    </div>
  )
}
