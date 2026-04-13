import { useEffect, useRef, useState } from 'react'
import { Printer, Copy, Share2, Check, LinkIcon, Calendar } from 'lucide-react'
import type { TripPlan } from '@/types/trip-plan'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { useUiStore } from '@/store/ui-store'
import { planToText } from '@/utils/export-text'
import { downloadIcs } from '@/utils/export-ics'
import { buildShareUrl, disableSharing, enableSharing } from '@/utils/share-link'
import { logger } from '@/utils/logger'

export interface ExportMenuProps {
  plan: TripPlan
  tripId: string
  shared: boolean
  shareToken: string | null
}

export function ExportMenu({ plan, tripId, shared, shareToken }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const addToast = useUiStore((s) => s.addToast)

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
        className="flex items-center gap-1.5"
      >
        <Share2 size={14} />
        Export
      </Button>

      {open && (
        <div className="absolute right-0 top-11 w-60 bg-bg-elevated border border-border-default rounded-xl p-1.5 shadow-[0_8px_24px_#00000066] z-20 flex flex-col">
          <MenuButton icon={Printer} label="Print / save PDF" onClick={printPdf} />
          <MenuButton icon={Copy} label="Copy as text" onClick={copyText} />
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
  copied,
  setCopied,
  onClose,
}: {
  tripId: string
  shared: boolean
  shareToken: string | null
  copied: boolean
  setCopied: (c: boolean) => void
  onClose: () => void
}) {
  const [working, setWorking] = useState(false)
  // Track locally so the UI updates instantly after enable/disable without
  // waiting for the Firestore snapshot to round-trip.
  const [localShared, setLocalShared] = useState(shared)
  const [localToken, setLocalToken] = useState<string | null>(shareToken)
  const addToast = useUiStore((s) => s.addToast)

  useEffect(() => {
    setLocalShared(shared)
    setLocalToken(shareToken)
  }, [shared, shareToken])

  const url = localToken ? buildShareUrl(localToken) : null

  const enable = async () => {
    setWorking(true)
    try {
      const token = await enableSharing(tripId)
      setLocalToken(token)
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
      <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
        <Button variant="ghost" onClick={disable} disabled={working}>
          Disable sharing
        </Button>
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  )
}
