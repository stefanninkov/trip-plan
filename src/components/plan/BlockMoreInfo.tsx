import { useState } from 'react'
import {
  ChevronDown,
  Loader2,
  Sparkles,
  MapPin,
  Phone,
  Globe,
  Clock,
  Star,
  Search,
  ExternalLink,
} from 'lucide-react'
import type { TimeBlock, TravelMode } from '@/types/trip-plan'
import type { TripEditor } from '@/hooks/useTripEditor'
import { useEnrichBlock } from '@/hooks/useEnrichBlock'
import { useBlockLookup } from '@/hooks/useBlockLookup'
import { useUiStore } from '@/store/ui-store'
import { TipBlock } from './TipBlock'
import { TRAVEL_MODES } from '@/constants/travel-modes'
import { cn } from '@/utils/cn'
import { googleMapsSearchUrl } from '@/utils/maps-link'

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
  const placeInfo = block.placeInfo ?? null
  const hasExtras = Boolean(
    block.whyPicked ||
      block.historicalContext ||
      block.tip ||
      block.warning ||
      block.travelMode ||
      placeInfo
  )
  const [open, setOpen] = useState(false)
  const { loading, run } = useEnrichBlock()
  const { loading: lookingUp, run: runLookup } = useBlockLookup()
  const addToast = useUiStore((s) => s.addToast)
  const canEnrich = Boolean(onEnrich || (editor && dayId))
  const canLookup = Boolean(editor && dayId && location)
  const mapsUrl = placeInfo?.mapsUrl || googleMapsSearchUrl(block.title, location)

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

  const handleLookup = async (): Promise<void> => {
    if (!editor || !dayId) return
    const info = await runLookup({ query: block.title, location })
    if (!info) {
      addToast('error', 'No place details found for this block')
      return
    }
    editor.updateBlock(dayId, block.id, { placeInfo: info })
    addToast('success', 'Place details attached')
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
        {canLookup && (
          <button
            type="button"
            onClick={handleLookup}
            disabled={lookingUp}
            className="flex items-center gap-1.5 text-[12px] font-medium text-accent hover:text-accent-hover disabled:opacity-60 transition-colors"
          >
            {lookingUp ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Search size={14} />
            )}
            {lookingUp ? 'Searching\u2026' : placeInfo ? 'Refresh place info' : 'Find place info'}
          </button>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[12px] font-medium text-accent hover:text-accent-hover transition-colors"
        >
          <MapPin size={14} />
          Open in Maps
          <ExternalLink size={10} />
        </a>
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
          {placeInfo && <PlaceDetails info={placeInfo} />}
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

function PlaceDetails({ info }: { info: NonNullable<TimeBlock['placeInfo']> }) {
  return (
    <div className="flex flex-col gap-1.5 bg-bg-elevated border border-border-subtle rounded-md px-3 py-2 text-[12px]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.8px] text-text-tertiary">
        Place details
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        {info.rating && (
          <span className="flex items-center gap-1 text-text-secondary">
            <Star size={11} fill="currentColor" /> {info.rating.toFixed(1)}
          </span>
        )}
        {info.priceLevel && (
          <span className="text-text-secondary">{info.priceLevel}</span>
        )}
        {info.address && (
          <span className="flex items-center gap-1 text-text-secondary truncate">
            <MapPin size={11} />
            {info.address}
          </span>
        )}
        {info.hours && (
          <span className="flex items-center gap-1 text-text-secondary truncate">
            <Clock size={11} />
            {info.hours}
          </span>
        )}
        {info.phone && (
          <a href={`tel:${info.phone}`} className="flex items-center gap-1 text-text-secondary hover:text-text-primary">
            <Phone size={11} />
            {info.phone}
          </a>
        )}
        {info.website && (
          <a
            href={info.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-accent"
          >
            <Globe size={11} />
            {tryHostname(info.website)}
            <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  )
}

function tryHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
