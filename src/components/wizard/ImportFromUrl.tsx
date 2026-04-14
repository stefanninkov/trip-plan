import { useState } from 'react'
import { Link2, Loader2, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { useAuthStore } from '@/store/auth-store'
import { useUiStore } from '@/store/ui-store'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Card } from '@/components/shared/Card'
import { sanitizeForFirestore } from '@/utils/sanitize'
import { logger } from '@/utils/logger'
import { ROUTES } from '@/constants/routes'
import type { TripPlan } from '@/types/trip-plan'

/**
 * Paste any travel-blog / Wanderlog / shared-doc URL and Claude turns it
 * into a full editable TripPlan. The created trip is saved like any
 * other (status=complete) so it's immediately openable.
 */
export function ImportFromUrl() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const addToast = useUiStore((s) => s.addToast)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (): Promise<void> => {
    if (!user) return
    if (!FUNCTIONS_BASE_URL) {
      addToast('error', 'Backend not configured')
      return
    }
    const trimmed = url.trim()
    if (!/^https?:\/\//i.test(trimmed)) {
      addToast('error', t('import.invalidUrl'))
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${FUNCTIONS_BASE_URL}/importTrip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: trimmed,
          language: (i18n.resolvedLanguage ?? 'en').startsWith('sr') ? 'sr' : 'en',
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { plan: TripPlan }
      const ref = await addDoc(collection(db, 'trips'), {
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        inputs: sanitizeForFirestore({
          origin: '',
          originCountry: '',
          destinations: [],
          startDate: data.plan.days[0]?.date ?? '',
          endDate: data.plan.days[data.plan.days.length - 1]?.date ?? '',
          travelers: data.plan.travelers || 2,
          budgetLevel: 'mid',
          interests: [],
          pace: 'moderate',
          accommodationType: 'any',
          dietaryNeeds: '',
          mobilityNotes: '',
          homeCurrency: 'EUR',
          notes: `Imported from ${trimmed}`,
        }),
        plan: sanitizeForFirestore(data.plan),
        status: 'complete',
        shared: false,
        shareToken: null,
      })
      addToast('success', t('import.done'))
      navigate(ROUTES.trip(ref.id))
    } catch (err) {
      const m = err instanceof Error ? err.message : t('import.failed')
      logger.error('importTrip failed', err)
      addToast('error', m)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[14px] font-semibold">
        <Link2 size={16} className="text-accent" />
        {t('import.heading')}
      </div>
      <p className="text-[12px] text-text-tertiary">{t('import.description')}</p>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit()
            }}
          />
        </div>
        <Button
          onClick={() => void submit()}
          disabled={loading || !url.trim()}
          className="flex items-center gap-1.5"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {loading ? t('import.importing') : t('import.button')}
        </Button>
      </div>
    </Card>
  )
}
