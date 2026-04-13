import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useTranslation } from 'react-i18next'
import { db } from '@/lib/firebase'
import { useTrip } from '@/hooks/useTrip'
import { PlanView } from '@/components/plan/PlanView'
import { Card } from '@/components/shared/Card'
import { CardSkeleton } from '@/components/shared/Skeleton'
import { Button } from '@/components/shared/Button'
import { AiProgress } from '@/components/shared/AiProgress'
import { ROUTES } from '@/constants/routes'
import { logger } from '@/utils/logger'

export function TripPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { trip, isLoading, error } = useTrip(tripId)
  const GENERATION_STAGES = [
    { at: 0, label: t('generation.stage0') },
    { at: 10, label: t('generation.stage10') },
    { at: 25, label: t('generation.stage25') },
    { at: 45, label: t('generation.stage45') },
    { at: 65, label: t('generation.stage65') },
    { at: 80, label: t('generation.stage80') },
    { at: 92, label: t('generation.stage92') },
  ]

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (error || !trip) {
    return (
      <Card className="flex flex-col items-center gap-2 text-center">
        <AlertTriangle size={24} className="text-warning" />
        <h2>{t('trip.notFound')}</h2>
        <p className="text-text-secondary">{error ?? ''}</p>
      </Card>
    )
  }

  if (trip.status === 'generating') {
    // If the trip has been stuck in 'generating' for longer than ~4 min,
    // the Cloud Function almost certainly finished (either succeeded
    // silently or crashed) without the client updating Firestore. Give the
    // user an escape hatch so they’re not stuck staring at the spinner.
    const updatedAt = trip.updatedAt ? new Date(trip.updatedAt).getTime() : 0
    const isStale = updatedAt > 0 && Date.now() - updatedAt > 4 * 60 * 1000

    const markError = async () => {
      try {
        await updateDoc(doc(db, 'trips', trip.id), {
          status: 'error',
          updatedAt: serverTimestamp(),
        })
      } catch (err) {
        logger.error('TripPage markError:', err)
      }
    }

    const deleteAndStartOver = async () => {
      try {
        await deleteDoc(doc(db, 'trips', trip.id))
        navigate(ROUTES.newTrip)
      } catch (err) {
        logger.error('TripPage deleteAndStartOver:', err)
      }
    }

    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1>{t('trip.generating')}</h1>
          <p className="text-text-secondary">{t('trip.claudeIsWorking')}</p>
        </div>
        <AiProgress
          stages={GENERATION_STAGES}
          timeConstant={22}
          hint={t('generation.hint')}
        />
        {isStale && (
          <Card className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">{t('trip.stuckTitle')}</p>
                <p className="text-[13px] text-text-secondary">{t('trip.stuckBody')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={markError}>
                {t('trip.markFailed')}
              </Button>
              <Button onClick={deleteAndStartOver}>{t('trip.deleteAndStartOver')}</Button>
            </div>
          </Card>
        )}
      </div>
    )
  }

  if (trip.status === 'error' || !trip.plan) {
    return (
      <Card className="flex flex-col items-center gap-2 text-center">
        <AlertTriangle size={24} className="text-error" />
        <h2>{t('trip.generationFailed')}</h2>
        <p className="text-text-secondary">{t('trip.generationFailedBody')}</p>
        <div className="flex gap-2 mt-2">
          <Button onClick={() => navigate(ROUTES.newTrip)}>{t('trip.startOver')}</Button>
        </div>
      </Card>
    )
  }

  return (
    <PlanView
      plan={trip.plan}
      tripId={trip.id}
      inputs={trip.inputs}
      shared={trip.shared}
      shareToken={trip.shareToken}
    />
  )
}
