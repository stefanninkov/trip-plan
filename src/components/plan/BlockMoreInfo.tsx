import { useState } from 'react'
import { ChevronDown, Loader2, Sparkles } from 'lucide-react'
import type { TimeBlock, TravelMode } from '@/types/trip-plan'
import type { TripEditor } from '@/hooks/useTripEditor'
import { useEnrichBlock } from '@/hooks/useEnrichBlock'
import { useUiStore } from '@/store/ui-store'
import { TipBlock } from './TipBlock'
import { TRAVEL_MODES } from '@/constants/travel-modes'
import { cn } from '@/utils/cn'

export interface BlockMoreInfoProps {
  block: TimeBlock
  location: string
  dayTitle: string
  /** When provided, enables AI enrichment; writes the result back. */
  onEnrich?: (patch: Partial<TimeBlock>) => void
  /** Editor shortcut for convenience (preferred over onEnrich) */
  editor?: TripEditor
  dayId?: string
  className?: string
}

export function BlockMoreInfo({
  block,
  location,
  dayTitle,
  onEnrich,
  editor,
  dayId,
  className,
}: BlockMoreInfoProps) {
  const hasExtras = Boolean(
    block.whyPicked || block.historicalContext || block.tip || block.warning || block.travelMode
  )
  const [open, setOpen] = useState(false)
  const { loading, run } = useEnrichBlock()
  const addToast = useUiStore((s) => s.addToast)
  const canEnrich = Boolean(onEnrich || (editor && dayId))

  const handleEnrich = async (): Promise<void> => {
    const enriched = await run({
      block: { title: block.title, description: block.description, time: block.time },
      location,
      dayTitle,
    })
    if (!enriched) {
      addToast('error', 'Could not load more info')
      return
    }
    const patch: Partial<TimeBlock> = {
      description: enriched.description || block.description,
      whyPicked: enriched.whyPicked || null,
      historicalContext: enriched.historicalContext ?? null,
      tip: enriched.tip ?? block.tip ?? null,
      warning: enriched.warning ?? block.warning ?? null,
    }
    if (onEnrich) onEnrich(patch)
    else if (editor && dayId) editor.updateBlock(dayId, block.id, patch)
    addToast('success', 'Block enriched with more info')
    setOpen(true)
  }

  if (!hasExtras && !canEnrich) return null

  const ModeIcon = block.travelMode ? TRAVEL_MODES[block.travelMode as TravelMode].icon : null

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {hasExtras && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={cn(
              'flex items-center gap-1.5 text-[12px] font-medium transition-colors',
              open ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <ChevronDown
              size={14}
              className={cn('transition-transform duration-200', open && 'rotate-180')}
            />
            {open ? 'Hide details' : 'More info'}
          </button>
        )}
        {canEnrich && (
          <button
            type="button"
            onClick={handleEnrich}
            disabled={loading}
            className="flex items-center gap-1.5 text-[12px] font-medium text-accent hover:text-accent-hover disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {loading ? 'Researching\u2026' : hasExtras ? 'Refresh with AI' : 'Learn more with AI'}
          </button>
        )}
      </div>

      {open && hasExtras && (
        <div className="flex flex-col gap-2">
          {block.travelMode && ModeIcon && (
            <div className="flex items-center gap-2 text-[12px] text-text-secondary bg-bg-elevated rounded-md px-3 py-2">
              <ModeIcon size={14} className="text-accent" />
              Travel mode:{' '}
              <span className="text-text-primary font-semibold">
                {TRAVEL_MODES[block.travelMode as TravelMode].label}
              </span>
            </div>
          )}
          {block.whyPicked && <TipBlock kind="why" text={block.whyPicked} />}
          {block.historicalContext && (
            <TipBlock kind="history" text={block.historicalContext} />
          )}
          {block.tip && <TipBlock kind="tip" text={block.tip} />}
          {block.warning && <TipBlock kind="warning" text={block.warning} />}
        </div>
      )}
    </div>
  )
}
