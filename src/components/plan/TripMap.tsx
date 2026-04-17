import { useEffect, useState } from 'react'
import { Loader2, MapPinOff } from 'lucide-react'
import type { TripPlan } from '@/types/trip-plan'
import { geocodeDetailed, type Coord } from '@/utils/geocode'
import { RouteSvg } from './RouteSvg'

interface DayCoord {
  day: TripPlan['days'][number]
  coord: Coord | null
  error: string | null
}

const TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

export interface TripMapProps {
  plan: TripPlan
}

/**
 * Static map rendering of the trip route. Uses the Mapbox Static Images
 * API which works with simple tokens and never goes blank the way
 * mapbox-gl can when the vector style endpoint is restricted. When no
 * token is set, falls back to OSM Static (staticmap.openstreetmap.de)
 * via a same-host proxy URL.
 */
export function TripMap({ plan }: TripMapProps) {
  const [dayCoords, setDayCoords] = useState<DayCoord[]>([])
  const [loading, setLoading] = useState(true)
  const [imgFailed, setImgFailed] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setImgFailed(false)
      const out: DayCoord[] = []
      const seen = new Set<string>()
      for (const day of plan.days) {
        const r = await geocodeDetailed(day.location)
        if (cancelled) return
        out.push({ day, coord: r.coord, error: r.error })
        if (r.error) seen.add(r.error)
      }
      setDayCoords(out)
      setErrors(Array.from(seen))
      setLoading(false)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [plan.days])

  const placed = dayCoords.filter((d) => d.coord) as Array<DayCoord & { coord: Coord }>
  const unresolved = dayCoords.filter((d) => !d.coord)

  // Build a Mapbox static image URL with numbered pins (1-9 use the
  // built-in pin-l-N marker; days 10+ fall back to a plain pin-l).
  const buildMapboxStaticUrl = (): string | null => {
    if (!TOKEN || placed.length === 0) return null
    const pinSegs = placed.slice(0, 14).map((p, i) => {
      const num = i + 1 <= 9 ? `${i + 1}` : ''
      const tag = num ? `pin-l-${num}+e49b5a` : 'pin-l+e49b5a'
      return `${tag}(${p.coord.lng.toFixed(5)},${p.coord.lat.toFixed(5)})`
    })
    let pathSeg = ''
    if (placed.length >= 2) {
      // Inline LineString polyline: lonlat,lonlat,...
      const coords = placed
        .slice(0, 50)
        .map((p) => `[${p.coord.lng.toFixed(5)},${p.coord.lat.toFixed(5)}]`)
        .join(',')
      pathSeg = `geojson(${encodeURIComponent(
        JSON.stringify({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: placed
              .slice(0, 50)
              .map((p) => [p.coord.lng, p.coord.lat]),
          },
        })
      )})`
      void coords
    }
    const overlay = pathSeg ? `${pathSeg},${pinSegs.join(',')}` : pinSegs.join(',')
    const viewport =
      placed.length >= 2
        ? 'auto'
        : `${placed[0].coord.lng.toFixed(5)},${placed[0].coord.lat.toFixed(5)},9,0`
    return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${overlay}/${viewport}/1200x520@2x?padding=60&access_token=${TOKEN}`
  }

  const mapboxUrl = buildMapboxStaticUrl()

  // SVG fallback data: one entry per placed day, used when Mapbox static
  // fails (no token, token restrictions, URL too long, etc.).
  const svgDays = placed.map((p) => ({
    dayNumber: p.day.dayNumber,
    title: p.day.title,
    location: p.day.location,
    coord: p.coord,
  }))

  const showMapbox = !imgFailed && mapboxUrl

  return (
    <div className="flex flex-col gap-3">
      <div
        className="w-full rounded-xl overflow-hidden border border-border-subtle bg-bg-surface flex items-center justify-center"
        style={{ minHeight: '520px' }}
      >
        {loading ? (
          <div className="flex items-center gap-2 text-[13px] text-text-tertiary p-6">
            <Loader2 size={14} className="animate-spin" />
            Geocoding locations…
          </div>
        ) : showMapbox ? (
          <img
            src={mapboxUrl}
            alt={`${plan.tripTitle} route map`}
            className="w-full h-auto block"
            onError={() => setImgFailed(true)}
          />
        ) : svgDays.length > 0 ? (
          <RouteSvg days={svgDays} />
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-tertiary p-6">
            <MapPinOff size={20} />
            <p className="text-[13px] text-center max-w-md">
              Could not render a map. The day locations may be too generic.
            </p>
            {errors.length > 0 && (
              <ul className="flex flex-col gap-1 text-[11px] font-cost">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {!loading && unresolved.length > 0 && placed.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-bg-secondary p-3 text-[12px] text-text-tertiary">
          <p className="text-text-secondary">
            Couldn&apos;t place {unresolved.length} day
            {unresolved.length === 1 ? '' : 's'} on the map:
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {unresolved.map(({ day }) => (
              <li
                key={day.id}
                className="px-2 py-0.5 rounded-full bg-bg-elevated text-text-tertiary"
              >
                Day {day.dayNumber} &middot; {day.location}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && placed.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {placed.map(({ day }) => (
            <li
              key={day.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-[13px]"
            >
              <span className="w-6 h-6 rounded-full bg-accent-muted text-accent font-cost font-bold flex items-center justify-center shrink-0 text-[11px]">
                {day.dayNumber}
              </span>
              <span className="truncate">
                <span className="text-text-primary">{day.title}</span>{' '}
                <span className="text-text-tertiary">· {day.location}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
