import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import i18n from 'i18next'
import { useSharedTrip } from '@/hooks/useSharedTrip'
import { PlanView } from '@/components/plan/PlanView'
import { Card } from '@/components/shared/Card'
import { CardSkeleton } from '@/components/shared/Skeleton'
import { applyShareOptions } from '@/utils/sanitize-plan'

export function SharedTripPage() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const [searchParams] = useSearchParams()
  const { trip, isLoading, error } = useSharedTrip(shareToken)

  // Pick the language the sharer picked when they made the link (?lang=xx
  // wins over the stored shareOptions.language). We change i18n for the
  // duration of the shared view so UI labels match the plan language.
  const urlLang = searchParams.get('lang')
  const storedLang = trip?.shareOptions?.language
  const targetLang =
    urlLang === 'sr' || urlLang === 'en'
      ? urlLang
      : storedLang === 'sr' || storedLang === 'en'
        ? storedLang
        : null

  useEffect(() => {
    if (!targetLang) return
    if (i18n.resolvedLanguage !== targetLang) {
      void i18n.changeLanguage(targetLang)
    }
  }, [targetLang])

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="w-full max-w-3xl flex flex-col gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (error || !trip || !trip.plan) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <Card className="max-w-md flex flex-col items-center text-center gap-2">
          <AlertTriangle size={24} className="text-warning" />
          <h2>Shared trip unavailable</h2>
          <p className="text-text-secondary">{error ?? 'This link is no longer active.'}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-dvh">
      <div className="max-w-[960px] mx-auto px-4 md:px-8 lg:px-10 py-6 lg:py-10">
        <div className="mb-4 text-[12px] font-semibold uppercase tracking-[1.5px] text-text-tertiary">
          Shared with you · read-only
        </div>
        <PlanView
          plan={applyShareOptions(trip.plan, trip.shareOptions)}
          tripId={trip.id}
          readOnly
        />
      </div>
    </div>
  )
}
