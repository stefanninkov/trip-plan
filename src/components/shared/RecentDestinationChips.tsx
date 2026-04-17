import { useEffect, useMemo, useState } from 'react'
import { Clock, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  getRecentDestinations,
  removeRecentDestination,
  type RecentDestination,
  type RecentKind,
} from '@/utils/recent-destinations'
import { useTrips } from '@/hooks/useTrips'
import { cn } from '@/utils/cn'

export interface RecentDestinationChipsProps {
  onPick: (dest: RecentDestination) => void
  /** Which history to read from. Origin step and destination step keep
   *  independent lists so they don't cross-contaminate. */
  kind?: RecentKind
  /** Display names to hide (already used in the current form) */
  exclude?: string[]
  className?: string
}

const MAX_SHOWN = 5

export function RecentDestinationChips({
  onPick,
  kind = 'destination',
  exclude = [],
  className,
}: RecentDestinationChipsProps) {
  const { t } = useTranslation()
  const [localRecents, setLocalRecents] = useState<RecentDestination[]>([])
  const { trips } = useTrips()

  useEffect(() => {
    setLocalRecents(getRecentDestinations(kind))
  }, [kind])

  // Merge localStorage picks with only the step-appropriate field from saved
  // trips — origins for the origin step, destinations for the destination
  // step — so origins and destinations never leak across histories.
  const recents = useMemo<RecentDestination[]>(() => {
    const byKey = new Map<string, RecentDestination>()
    const add = (r: RecentDestination): void => {
      const key = r.displayName.toLowerCase()
      const existing = byKey.get(key)
      if (!existing || existing.usedAt < r.usedAt) {
        byKey.set(key, r)
      }
    }
    localRecents.forEach(add)
    trips.forEach((trip) => {
      const createdAt = trip.createdAt ? new Date(trip.createdAt).getTime() : 0
      if (kind === 'origin') {
        const originName = trip.inputs?.origin
        const originCountry = trip.inputs?.originCountry ?? ''
        if (!originName) return
        const display = originCountry ? `${originName}, ${originCountry}` : originName
        add({
          city: originName,
          country: originCountry,
          displayName: display,
          usedAt: createdAt,
        })
      } else {
        const dests = trip.inputs?.destinations
        if (!Array.isArray(dests)) return
        dests.forEach((d) => {
          if (!d?.city) return
          const display = d.country ? `${d.city}, ${d.country}` : d.city
          add({
            city: d.city,
            country: d.country ?? '',
            displayName: display,
            usedAt: createdAt,
          })
        })
      }
    })
    return Array.from(byKey.values())
      .sort((a, b) => b.usedAt - a.usedAt)
      .slice(0, MAX_SHOWN)
  }, [localRecents, trips, kind])

  const excludeSet = new Set(exclude.map((s) => s.toLowerCase()))
  const visible = recents.filter((r) => !excludeSet.has(r.displayName.toLowerCase()))
  if (visible.length === 0) return null

  const handleRemove = (displayName: string): void => {
    removeRecentDestination(displayName, kind)
    // Also drop it from the merged view immediately — if it was sourced from a
    // saved trip, it'll be re-added on next refresh, which is fine.
    setLocalRecents((prev) => prev.filter((r) => r.displayName !== displayName))
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span className="flex items-center gap-1 text-[11px] text-text-tertiary">
        <Clock size={11} />
        {t('recentDestinations.label')}
      </span>
      {visible.map((r) => (
        <span
          key={r.displayName}
          className="inline-flex items-stretch rounded-full border border-border-subtle bg-bg-secondary overflow-hidden hover:border-border-strong transition-colors"
        >
          <button
            type="button"
            onClick={() => onPick(r)}
            className="text-[12px] pl-2 pr-1.5 py-1 text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            {r.displayName}
          </button>
          <button
            type="button"
            onClick={() => handleRemove(r.displayName)}
            aria-label={t('recentDestinations.remove', { name: r.displayName })}
            title={t('recentDestinations.remove', { name: r.displayName })}
            className="flex items-center pr-1.5 pl-1 text-text-tertiary hover:text-error hover:bg-bg-elevated transition-colors"
          >
            <X size={11} />
          </button>
        </span>
      ))}
    </div>
  )
}
