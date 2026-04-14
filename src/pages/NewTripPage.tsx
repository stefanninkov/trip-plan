import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useWizardStore } from '@/store/wizard-store'
import { useUiStore } from '@/store/ui-store'
import { logger } from '@/utils/logger'
import type { TripInputs } from '@/types/wizard'
import { TripWizard } from '@/components/wizard/TripWizard'
import { ImportFromUrl } from '@/components/wizard/ImportFromUrl'

export function NewTripPage() {
  const [params, setParams] = useSearchParams()
  const setInputs = useWizardStore((s) => s.setInputs)
  const addToast = useUiStore((s) => s.addToast)
  const fromTripId = params.get('from')

  useEffect(() => {
    if (!fromTripId) return
    let cancelled = false
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'trips', fromTripId))
        if (!snap.exists()) {
          addToast('error', 'Source trip not found')
          return
        }
        if (cancelled) return
        const data = snap.data() as { inputs: TripInputs }
        setInputs(data.inputs)
        addToast('info', 'Inputs loaded from previous trip')
      } catch (err) {
        logger.error('Preload inputs failed:', err)
        addToast('error', 'Could not load inputs')
      } finally {
        if (!cancelled) {
          params.delete('from')
          setParams(params, { replace: true })
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromTripId])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">New trip</p>
        <h1>Plan your trip</h1>
      </div>
      <ImportFromUrl />
      <TripWizard />
    </div>
  )
}
