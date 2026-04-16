import { useState } from 'react'
import { Languages, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { useUiStore } from '@/store/ui-store'
import { logger } from '@/utils/logger'
import { cn } from '@/utils/cn'
import type { TripPlan } from '@/types/trip-plan'
import type { TripEditor } from '@/hooks/useTripEditor'

/**
 * One-click "translate this whole plan" pill. Calls the translateTrip
 * Cloud Function which returns the same JSON structure with free-text
 * fields translated into the currently-selected UI language. Preserves
 * ids, dates, times, numbers and real place names.
 */
export function TranslateTripButton({
  plan,
  editor,
}: {
  plan: TripPlan
  editor: TripEditor
}) {
  const { t } = useTranslation()
  const addToast = useUiStore((s) => s.addToast)
  const [busy, setBusy] = useState(false)
  const target =
    (i18n.resolvedLanguage ?? 'en').toLowerCase().startsWith('sr') ? 'sr' : 'en'
  const targetLabel = target === 'sr' ? 'Srpski' : 'English'

  const run = async (): Promise<void> => {
    if (!FUNCTIONS_BASE_URL) {
      addToast('error', 'Backend not configured')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`${FUNCTIONS_BASE_URL}/translateTrip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, language: target }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { plan: TripPlan }
      editor.replacePlan(data.plan)
      addToast('success', t('translate.done'))
    } catch (err) {
      const m = err instanceof Error ? err.message : t('translate.failed')
      logger.error('translateTrip failed', err)
      addToast('error', m)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={busy}
      title={t('translate.title', { lang: targetLabel })}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors',
        busy
          ? 'border-border-default bg-bg-secondary text-text-tertiary'
          : 'border-border-default bg-bg-secondary text-text-secondary hover:text-text-primary hover:border-border-strong'
      )}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Languages size={13} />}
      {busy
        ? t('translate.translating')
        : t('translate.button', { lang: targetLabel })}
    </button>
  )
}
