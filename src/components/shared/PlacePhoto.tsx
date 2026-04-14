import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { placePhotoUrlWithSig } from '@/utils/place-photo'
import { cn } from '@/utils/cn'

export interface PlacePhotoProps {
  /** Query used to match an Unsplash photo (e.g. "pastel de nata, Lisbon"). */
  query: string
  /** Unique seed so two cards with the same query show different photos. */
  sig: string
  /** Optional direct src override (e.g. SerpAPI thumbnailUrl). Wins over query. */
  src?: string | null
  alt?: string
  className?: string
  aspectRatio?: string
}

/**
 * Small image tile for activity / place / food cards. Falls back to a
 * subtle icon block on error or when no query is provided.
 */
export function PlacePhoto({
  query,
  sig,
  src,
  alt,
  className,
  aspectRatio = '16 / 9',
}: PlacePhotoProps) {
  const [failed, setFailed] = useState(false)
  const resolvedSrc = src || (query ? placePhotoUrlWithSig(query, sig) : '')
  if (!resolvedSrc || failed) {
    return (
      <div
        className={cn(
          'w-full rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-tertiary',
          className
        )}
        style={{ aspectRatio }}
      >
        <ImageOff size={18} />
      </div>
    )
  }
  return (
    <img
      src={resolvedSrc}
      alt={alt || query}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(
        'w-full rounded-lg object-cover border border-border-subtle',
        className
      )}
      style={{ aspectRatio }}
    />
  )
}
