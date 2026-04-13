import { useEffect, useMemo, useState } from 'react'
import { Clock, X } from 'lucide-react'
import {
  clearRecentDestinations,
  getRecentDestinations,
  type RecentDestination,
} from '@/utils/recent-destinations'
import { useTrips } from '@/hooks/useTrips'
import { cn } from '@/utils/cn'

export interface RecentDestinationChipsProps {
  onPick: (dest: RecentDestination) => void
  /** Optional set of display names to hide (already used in the current form) */
  exclude?: string[]
  className?: string
}

export function RecentDestinationChips({
  onPick,
  exclude = [],
  className,
}: RecentDestinationChipsProps) {
  const [localRecents, setLocalRecents] = useState<RecentDestination[]>([])
  const { trips } = useTrips()

  useEffect(() => {
    setLocalRecents(getRecentDestinations())
  }, [])

  // Merge localStorage picks with destinations pulled from the user's saved
  // trips in Firestore, so a fresh browser session still sees places they've
  // already planned for. Localstorage entries win on usedAt, then Firestore
  // destinations fill in by createdAt order.
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
    trips.forEach((t) => {
      const createdAt = t.createdAt ? new Date(t.createdAt).getTime() : 0
      const dests = t.inputs?.destinations
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
    })
    return Array.from(byKey.values())
      .sort((a, b) => b.usedAt - a.usedAt)
      .slice(0, 8)
  }, [localRecents, trips])

  const excludeSet = new Set(exclude.map((s) => s.toLowerCase()))
  const visible = recents.filter((r) => !excludeSet.has(r.displayName.toLowerCase()))
  if (visible.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span className="flex items-center gap-1 text-[11px] text-text-tertiary">
        <Clock size={11} />
        Recent:
      </span>
      {visible.map((r) => (
        <button
          key={r.displayName}
          type="button"
          onClick={() => onPick(r)}
          className="text-[12px] px-2 py-1 rounded-full border border-border-subtle bg-bg-secondary text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
        >
          {r.displayName}
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          clearRecentDestinations()
          setLocalRecents([])
        }}
        aria-label="Clear recent destinations"
        className="ml-1 text-text-tertiary hover:text-text-secondary"
      >
        <X size={12} />
      </button>
    </div>
  )
}
