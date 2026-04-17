import { MapPin } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface TripCoverProps {
  location: string
  className?: string
}

/**
 * Hash a string to a stable hue so every location gets its own signature
 * cover gradient.
 */
function hashHue(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h) % 360
}

export function TripCover({ location, className }: TripCoverProps) {
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
      <div className="absolute inset-0 flex items-end p-5">
        <div className="flex items-center gap-2 text-white/80">
          <MapPin size={16} />
          <span className="text-[13px] uppercase tracking-[2px] font-semibold">
            {location}
          </span>
        </div>
      </div>

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
