import { useEffect, useState } from 'react'
import { geocode } from '@/utils/geocode'
import { cn } from '@/utils/cn'

const TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

export interface TripCoverProps {
  location: string
  className?: string
}

/**
 * Renders a subtle gradient cover photo using the Mapbox Static Images API
 * centered on the first destination. Completely optional — returns null if
 * no token or geocoding fails.
 */
export function TripCover({ location, className }: TripCoverProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!TOKEN || !location) {
      setUrl(null)
      return
    }
    let cancelled = false
    void geocode(location).then((coord) => {
      if (cancelled || !coord) return
      const w = 1200
      const h = 300
      const zoom = 11
      const src = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${coord.lng},${coord.lat},${zoom},0/${w}x${h}@2x?access_token=${TOKEN}&logo=false&attribution=false`
      setUrl(src)
    })
    return () => {
      cancelled = true
    }
  }, [location])

  if (!url) return null
  return (
    <div
      className={cn(
        'relative w-full rounded-xl overflow-hidden border border-border-subtle',
        className
      )}
      style={{ aspectRatio: '4 / 1' }}
    >
      <img
        src={url}
        alt={location}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, var(--color-bg-primary) 0%, rgba(26,26,30,0.3) 50%, transparent 100%)',
        }}
      />
    </div>
  )
}
