import { useMemo, useState } from 'react'
import { Languages, Loader2, X } from 'lucide-react'
import i18n from 'i18next'
import { useTranslation } from 'react-i18next'
import type { TripPlan } from '@/types/trip-plan'
import type { TripEditor } from '@/hooks/useTripEditor'
import { FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { useUiStore } from '@/store/ui-store'
import { logger } from '@/utils/logger'
import { detectPlanLanguage } from '@/utils/detect-plan-language'
import { Button } from '@/components/shared/Button'

/**
 * Big, hard-to-miss CTA that appears when the plan's detected language
 * does not match the current UI language. Clicking it runs the same
 * translateTrip flow as the pill button — but it's much more visible for
 * users returning to old plans.
 */
export function TranslateBanner({
  plan,
  editor,
}: {
  plan: TripPlan
  editor: TripEditor
}) {
  const { t } = useTranslation()
  const addToast = useUiStore((s) => s.addToast)
  const [busy, setBusy] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const uiLang = (i18n.resolvedLanguage ?? 'en').toLowerCase().startsWith('sr') ? 'sr' : 'en'
  const planLang = useMemo(() => detectPlanLanguage(plan), [plan])
  const needsTranslation = uiLang !== planLang
  const targetLabel = uiLang === 'sr' ? 'Srpski' : 'English'

  if (!needsTranslation || dismissed) return null

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
        body: JSON.stringify({ plan, language: uiLang }),
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
      logger.error('translateTrip (banner) failed', err)
      addToast('error', m)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-accent bg-accent-muted px-4 py-3 print:hidden">
      <Languages size={18} className="text-accent shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <p className="text-[13px] text-text-primary leading-[20px] m-0">
          {t('translate.bannerMessage')}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => void run()}
            disabled={busy}
            className="flex items-center gap-1.5"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Languages size={13} />}
            {busy ? t('translate.translating') : t('translate.bannerCta', { lang: targetLabel })}
          </Button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
        aria-label={t('common.close')}
      >
        <X size={16} />
      </button>
    </div>
  )
}
