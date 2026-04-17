import { useEffect, useRef, useState } from 'react'
import { Printer, Copy, Share2, Check, LinkIcon, Calendar, CalendarSync, Loader2 } from 'lucide-react'
import type { TripPlan } from '@/types/trip-plan'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { useUiStore } from '@/store/ui-store'
import { planToText } from '@/utils/export-text'
import { downloadIcs } from '@/utils/export-ics'
import type { ShareOptions } from '@/types/api'
import { buildShareUrl, disableSharing, enableSharing } from '@/utils/share-link'
import { getCalendarAccessToken, hasGoogleClientId, pushPlanToGoogleCalendar } from '@/utils/google-calendar'
import { logger } from '@/utils/logger'

export interface ExportMenuProps {
  plan: TripPlan
  tripId: string
  shared: boolean
  shareToken: string | null
  shareOptions?: ShareOptions
}

export function ExportMenu({ plan, tripId, shared, shareToken, shareOptions }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const addToast = useUiStore((s) => s.addToast)

  const pushToGoogle = async (): Promise<void> => {
    if (!hasGoogleClientId()) {
      addToast('error', 'Google Calendar sign-in is not configured')
      return
    }
    setSyncing(true)
    setOpen(false)
    try {
      const token = await getCalendarAccessToken()
      const { created, skipped } = await pushPlanToGoogleCalendar(plan, token)
      addToast(
        'success',
        `Added ${created} event${created === 1 ? '' : 's'} to Google Calendar${
          skipped > 0 ? ` (${skipped} skipped)` : ''
        }`
      )
    } catch (err) {
      logger.error('Google Calendar push failed:', err)
      addToast('error', err instanceof Error ? err.message : 'Could not sync calendar')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(planToText(plan))
      addToast('success', 'Plan copied to clipboard')
    } catch (err) {
      logger.error('Copy failed:', err)
      addToast('error', 'Could not copy')
    }
    setOpen(false)
  }

  const printPdf = () => {
    window.print()
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="secondary"
        onClick={() => setOpen((o) => !o)}
        disabled={syncing}
        className="flex items-center gap-1.5"
      >
        {syncing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
        Export
      </Button>

      {open && (
        <div className="absolute right-0 top-11 w-64 bg-bg-elevated border border-border-default rounded-xl p-1.5 shadow-[0_8px_24px_#00000066] z-20 flex flex-col">
          <MenuButton icon={Printer} label="Print / save PDF" onClick={printPdf} />
          <MenuButton icon={Copy} label="Copy as text" onClick={copyText} />
          {hasGoogleClientId() && (
            <MenuButton
              icon={CalendarSync}
              label="Send to Google Calendar"
              onClick={pushToGoogle}
            />
          )}
          <MenuButton
            icon={Calendar}
            label="Download calendar (.ics)"
            onClick={() => {
              try {
                downloadIcs(plan)
                addToast('success', 'Calendar file downloaded')
              } catch (err) {
                logger.error('ICS export failed:', err)
                addToast('error', 'Could not build calendar file')
              }
              setOpen(false)
            }}
          />
          <MenuButton
            icon={LinkIcon}
            label="Share link"
            onClick={() => {
              setShareOpen(true)
              setOpen(false)
            }}
          />
        </div>
      )}

      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share this trip"
      >
        <ShareContent
          tripId={tripId}
          shared={shared}
          shareToken={shareToken}
          initialLanguage={shareOptions?.language ?? 'en'}
          copied={copied}
          setCopied={setCopied}
          onClose={() => setShareOpen(false)}
        />
      </Modal>
    </div>
  )
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Printer
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-text-secondary hover:bg-bg-surface hover:text-text-primary rounded-md text-left transition-colors"
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

function ShareContent({
  tripId,
  shared,
  shareToken,
  initialLanguage,
  copied,
  setCopied,
  onClose,
}: {
  tripId: string
  shared: boolean
  shareToken: string | null
  initialLanguage: 'en' | 'sr'
  copied: boolean
  setCopied: (c: boolean) => void
  onClose: () => void
}) {
  const [working, setWorking] = useState(false)
  const [excludeNotes, setExcludeNotes] = useState(false)
  const [excludeCosts, setExcludeCosts] = useState(false)
  const [language, setLanguage] = useState<'en' | 'sr'>(initialLanguage)
  // Track locally so the UI updates instantly after enable/disable without
  // waiting for the Firestore snapshot to round-trip.
  const [localShared, setLocalShared] = useState(shared)
  const [localToken, setLocalToken] = useState<string | null>(shareToken)
  const [localLanguage, setLocalLanguage] = useState<'en' | 'sr'>(initialLanguage)
  const addToast = useUiStore((s) => s.addToast)

  useEffect(() => {
    setLocalShared(shared)
    setLocalToken(shareToken)
    setLocalLanguage(initialLanguage)
  }, [shared, shareToken, initialLanguage])

  const url = localToken ? buildShareUrl(localToken, localLanguage) : null

  const enable = async () => {
    setWorking(true)
    try {
      const token = await enableSharing(tripId, { excludeNotes, excludeCosts, language })
      setLocalToken(token)
      setLocalLanguage(language)
      setLocalShared(true)
      addToast('success', 'Sharing enabled')
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setWorking(false)
    }
  }

  const disable = async () => {
    setWorking(true)
    try {
      await disableSharing(tripId)
      setLocalShared(false)
      setLocalToken(null)
      addToast('info', 'Sharing disabled')
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setWorking(false)
    }
  }

  const copy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      addToast('error', 'Could not copy')
    }
  }

  if (!localShared || !url) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-text-secondary text-[13px]">
          Generate a secret link. Anyone with the link can view the plan in read-only mode.
        </p>
        <div className="flex flex-col gap-2 text-[13px]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={excludeNotes}
              onChange={(e) => setExcludeNotes(e.target.checked)}
              className="accent-[var(--color-accent)] w-4 h-4"
            />
            <span>
              Hide my personal notes (tips, warnings, why I picked it, historical context)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={excludeCosts}
              onChange={(e) => setExcludeCosts(e.target.checked)}
              className="accent-[var(--color-accent)] w-4 h-4"
            />
            <span>Hide costs and budget</span>
          </label>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] uppercase tracking-[1px] text-text-tertiary">
            Show the plan to the viewer in
          </span>
          <div className="flex gap-1.5">
            <LanguagePill active={language === 'en'} onClick={() => setLanguage('en')} label="English" />
            <LanguagePill active={language === 'sr'} onClick={() => setLanguage('sr')} label="Srpski" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={working} onClick={enable}>
            {working ? 'Creating...' : 'Create link'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-text-secondary text-[13px]">Anyone with this link can view the plan.</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={url}
          className="flex-1 bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-[12px] text-text-primary font-cost"
          onFocus={(e) => e.target.select()}
        />
        <Button variant="secondary" onClick={copy} className="flex items-center gap-1.5">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="flex items-center gap-2 text-[12px] text-text-tertiary">
        <span>Viewer language:</span>
        <LanguagePill
          active={localLanguage === 'en'}
          onClick={() => setLocalLanguage('en')}
          label="English"
          size="sm"
        />
        <LanguagePill
          active={localLanguage === 'sr'}
          onClick={() => setLocalLanguage('sr')}
          label="Srpski"
          size="sm"
        />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
        <Button variant="ghost" onClick={disable} disabled={working}>
          Disable sharing
        </Button>
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  )
}

function LanguagePill({
  active,
  onClick,
  label,
  size = 'md',
}: {
  active: boolean
  onClick: () => void
  label: string
  size?: 'sm' | 'md'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border transition-colors ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1.5 text-[12px]'
      } ${
        active
          ? 'border-accent bg-accent-muted text-text-primary'
          : 'border-border-default bg-bg-secondary text-text-secondary hover:text-text-primary hover:border-border-strong'
      }`}
    >
      {label}
    </button>
  )
}
