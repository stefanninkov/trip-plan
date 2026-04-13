import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Loader2, MapPinOff } from 'lucide-react'
import type { TripPlan } from '@/types/trip-plan'
import { geocodeDetailed, hasMapboxToken, type Coord } from '@/utils/geocode'

interface DayCoord {
  day: TripPlan['days'][number]
  coord: Coord | null
  error: string | null
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

// Free OSM raster tile style used when we don't have a Mapbox token. Lets the
// map still render (with coordinates resolved via Open-Meteo) instead of
// showing an empty placeholder.
const OSM_STYLE: mapboxgl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

export interface TripMapProps {
  plan: TripPlan
}

export function TripMap({ plan }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [dayCoords, setDayCoords] = useState<DayCoord[]>([])
  const [loading, setLoading] = useState(true)

  const [errors, setErrors] = useState<string[]>([])

  // Geocode every unique location
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      const results: DayCoord[] = []
      const seenErrors = new Set<string>()
      for (const day of plan.days) {
        const r = await geocodeDetailed(day.location)
        if (cancelled) return
        results.push({ day, coord: r.coord, error: r.error })
        if (r.error) seenErrors.add(r.error)
      }
      setDayCoords(results)
      setErrors(Array.from(seenErrors))
      setLoading(false)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [plan.days])

  // Build the map once we have at least one coord
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const pts = dayCoords.filter((d) => d.coord).map((d) => d.coord as Coord)
    if (pts.length === 0) return

    const style: mapboxgl.StyleSpecification | string = hasMapboxToken()
      ? 'mapbox://styles/mapbox/dark-v11'
      : OSM_STYLE

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center: [pts[0].lng, pts[0].lat],
      zoom: 4,
    })
    mapRef.current = map

    map.on('load', () => {
      // Fit all points
      const bounds = pts.reduce(
        (b, c) => b.extend([c.lng, c.lat]),
        new mapboxgl.LngLatBounds([pts[0].lng, pts[0].lat], [pts[0].lng, pts[0].lat])
      )
      map.fitBounds(bounds, { padding: 60, maxZoom: 9, duration: 0 })

      // Draw the route line between consecutive coords
      const lineCoords = dayCoords
        .filter((d) => d.coord)
        .map((d) => [d.coord!.lng, d.coord!.lat])
      if (lineCoords.length > 1) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: lineCoords },
          },
        })
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#E49B5A',
            'line-width': 3,
            'line-dasharray': [1, 1.5],
          },
        })
      }

      // Markers with number + popup
      dayCoords.forEach(({ day, coord }) => {
        if (!coord) return
        const el = document.createElement('div')
        el.className = 'trip-marker'
        el.textContent = String(day.dayNumber)
        new mapboxgl.Marker({ element: el })
          .setLngLat([coord.lng, coord.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(
              `<div style="font-family:'JetBrains Mono',monospace;font-size:13px;"><strong>Day ${day.dayNumber}</strong><br/>${escapeHtml(day.title)}<br/><span style="opacity:.7">${escapeHtml(day.location)}</span></div>`
            )
          )
          .addTo(map)
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [dayCoords])

  const placed = dayCoords.filter((d) => d.coord)
  const unresolved = dayCoords.filter((d) => !d.coord)
  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-border-subtle bg-bg-surface"
        style={{ height: '520px' }}
      />
      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-text-tertiary">
          <Loader2 size={14} className="animate-spin" />
          Geocoding locations&hellip;
        </div>
      )}
      {!loading && !hasMapboxToken() && placed.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-border-subtle bg-bg-secondary p-3 text-[12px] text-text-tertiary">
          <MapPinOff size={14} className="mt-0.5 shrink-0" />
          <p>
            Using OpenStreetMap fallback tiles because <code>VITE_MAPBOX_TOKEN</code> is not
            set. Add a Mapbox token for the dark themed map style.
          </p>
        </div>
      )}
      {!loading && placed.length === 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-error bg-[#D9555510] p-3 text-[13px]">
          <p className="text-error font-semibold">Could not resolve any locations on the map.</p>
          {errors.length > 0 && (
            <ul className="flex flex-col gap-1 text-text-secondary">
              {errors.map((e) => (
                <li key={e} className="font-cost text-[12px]">
                  {e}
                </li>
              ))}
            </ul>
          )}
          <p className="text-text-tertiary text-[12px]">
            Tried Mapbox first, then Open-Meteo as a fallback. If both failed, day locations
            may be too generic or your network blocks geocoding APIs.
          </p>
        </div>
      )}
      {!loading && placed.length > 0 && unresolved.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-bg-secondary p-3 text-[12px] text-text-tertiary">
          <p className="text-text-secondary">
            Couldn&apos;t place {unresolved.length} day{unresolved.length === 1 ? '' : 's'} on the map:
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
