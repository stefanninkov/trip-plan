import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPinOff, Loader2 } from 'lucide-react'
import type { TripPlan } from '@/types/trip-plan'
import { geocode, hasMapboxToken, type Coord } from '@/utils/geocode'
import { Card } from '@/components/shared/Card'

interface DayCoord {
  day: TripPlan['days'][number]
  coord: Coord | null
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

export interface TripMapProps {
  plan: TripPlan
}

export function TripMap({ plan }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [dayCoords, setDayCoords] = useState<DayCoord[]>([])
  const [loading, setLoading] = useState(true)

  // Geocode every unique location
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      const results: DayCoord[] = []
      for (const day of plan.days) {
        const coord = await geocode(day.location)
        if (cancelled) return
        results.push({ day, coord })
      }
      setDayCoords(results)
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
    if (!hasMapboxToken()) return
    const pts = dayCoords.filter((d) => d.coord).map((d) => d.coord as Coord)
    if (pts.length === 0) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
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

  if (!hasMapboxToken()) {
    return (
      <Card className="flex flex-col items-center text-center gap-2 py-10">
        <MapPinOff size={24} className="text-text-tertiary" />
        <h3>Map unavailable</h3>
        <p className="text-text-secondary">
          VITE_MAPBOX_TOKEN is not set. Add it to .env.production and redeploy to enable the
          map.
        </p>
      </Card>
    )
  }

  const placed = dayCoords.filter((d) => d.coord)
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
      {!loading && placed.length === 0 && (
        <p className="text-[13px] text-text-tertiary">
          Could not resolve any locations on the map. Try editing the day locations to be more
          specific.
        </p>
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
                <span className="text-text-tertiary">\u00B7 {day.location}</span>
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
