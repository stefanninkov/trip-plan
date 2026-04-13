import { useEffect, useState } from 'react'
import { Clock, X } from 'lucide-react'
import {
  clearRecentDestinations,
  getRecentDestinations,
  type RecentDestination,
} from '@/utils/recent-destinations'
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
  const [recents, setRecents] = useState<RecentDestination[]>([])

  useEffect(() => {
    setRecents(getRecentDestinations())
  }, [])

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
          setRecents([])
        }}
        aria-label="Clear recent destinations"
        className="ml-1 text-text-tertiary hover:text-text-secondary"
      >
        <X size={12} />
      </button>
    </div>
  )
}
