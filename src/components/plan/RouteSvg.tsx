import type { Coord } from '@/utils/geocode'

interface PlacedDay {
  dayNumber: number
  title: string
  location: string
  coord: Coord
}

export interface RouteSvgProps {
  days: PlacedDay[]
  width?: number
  height?: number
}

/**
 * Self-contained SVG rendering of the trip route. No external tiles,
 * no API calls, works offline. Uses a simple equirectangular projection
 * inside a padded bounding box so the pins fill the canvas nicely.
 *
 * Not a real geographic map — there's no land/ocean — but it always
 * renders, which is what we need as the final fallback when every
 * upstream provider is broken.
 */
export function RouteSvg({ days, width = 1200, height = 520 }: RouteSvgProps) {
  if (days.length === 0) return null

  const lats = days.map((d) => d.coord.lat)
  const lngs = days.map((d) => d.coord.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  // Ensure a minimum span so a single-point "route" doesn't divide by zero
  // and so points spread out even when very close together.
  const latSpan = Math.max(0.5, maxLat - minLat)
  const lngSpan = Math.max(0.5, maxLng - minLng)

  // Center the real bbox inside the widened span.
  const centerLat = (minLat + maxLat) / 2
  const centerLng = (minLng + maxLng) / 2
  const bbox = {
    minLat: centerLat - latSpan / 2,
    maxLat: centerLat + latSpan / 2,
    minLng: centerLng - lngSpan / 2,
    maxLng: centerLng + lngSpan / 2,
  }

  const padding = 50
  const innerW = width - padding * 2
  const innerH = height - padding * 2

  // Preserve aspect ratio: scale the smaller axis up so pins aren't stretched.
  const aspectData = lngSpan / latSpan
  const aspectBox = innerW / innerH
  let drawW = innerW
  let drawH = innerH
  if (aspectData > aspectBox) {
    drawH = innerW / aspectData
  } else {
    drawW = innerH * aspectData
  }
  const xOffset = (width - drawW) / 2
  const yOffset = (height - drawH) / 2

  const project = (c: Coord): [number, number] => {
    const x = xOffset + ((c.lng - bbox.minLng) / (bbox.maxLng - bbox.minLng)) * drawW
    // Y axis is flipped — higher latitude = smaller y (top of canvas).
    const y = yOffset + ((bbox.maxLat - c.lat) / (bbox.maxLat - bbox.minLat)) * drawH
    return [x, y]
  }

  const points = days.map((d) => project(d.coord))
  const pathD =
    points.length > 1
      ? `M ${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')}`
      : ''

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto block"
      style={{ background: '#222226' }}
      role="img"
      aria-label="Trip route overview"
    >
      {/* Subtle dot grid to give the canvas texture */}
      <defs>
        <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#2e2e34" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#dotgrid)" />

      {/* Route line */}
      {pathD && (
        <path
          d={pathD}
          fill="none"
          stroke="#E49B5A"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 6"
        />
      )}

      {/* Pins */}
      {days.map((d, i) => {
        const [x, y] = points[i]
        return (
          <g key={d.dayNumber} transform={`translate(${x}, ${y})`}>
            <circle r={18} fill="#E49B5A" stroke="#1a1a1e" strokeWidth={3} />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={14}
              fontWeight={700}
              fontFamily="'JetBrains Mono', ui-monospace, monospace"
              fill="#1a1a1e"
            >
              {d.dayNumber}
            </text>
            <text
              y={34}
              textAnchor="middle"
              fontSize={11}
              fontFamily="'IBM Plex Mono', ui-monospace, monospace"
              fill="#a0a0a8"
            >
              {d.location.length > 28 ? d.location.slice(0, 26) + '…' : d.location}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
