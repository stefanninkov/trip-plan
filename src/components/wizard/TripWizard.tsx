import { useNavigate } from 'react-router-dom'
import { useWizardStore } from '@/store/wizard-store'
import { useTripStore } from '@/store/trip-store'
import { useUiStore } from '@/store/ui-store'
import { useGenerateTrip } from '@/hooks/useGenerateTrip'
import { WizardProgress } from './WizardProgress'
import { WizardNav } from './WizardNav'
import { StepOrigin } from './StepOrigin'
import { StepDestinations } from './StepDestinations'
import { StepDates } from './StepDates'
import { StepTravelers } from './StepTravelers'
import { StepAdvanced } from './StepAdvanced'
import { ROUTES } from '@/constants/routes'

export function TripWizard() {
  const currentStep = useWizardStore((s) => s.currentStep)
  const inputs = useWizardStore((s) => s.inputs)
  const addToast = useUiStore((s) => s.addToast)
  const setCurrent = useTripStore((s) => s.setCurrent)
  const navigate = useNavigate()
  const { isGenerating, generate, error } = useGenerateTrip()

  const handleGenerate = async (): Promise<void> => {
    const result = await generate(inputs)
    if (result) {
      setCurrent(result.tripId, result.plan)
      addToast('success', 'Trip plan generated')
      navigate(ROUTES.trip(result.tripId))
    } else if (error) {
      addToast('error', error)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <WizardProgress />

      <div className="min-h-[280px]">
        {currentStep === 'origin' && <StepOrigin />}
        {currentStep === 'destinations' && <StepDestinations />}
        {currentStep === 'dates' && <StepDates />}
        {currentStep === 'travelers' && <StepTravelers />}
        {currentStep === 'advanced' && <StepAdvanced />}
      </div>

      {isGenerating && (
        <div className="rounded-lg border border-border-subtle bg-bg-secondary px-4 py-3 text-[13px] text-text-secondary">
          Contacting Claude and building your itinerary\u2026 this can take up to 60 seconds for
          longer trips.
        </div>
      )}

      {error && !isGenerating && (
        <div className="rounded-lg border border-error bg-[#D9555510] px-4 py-3 text-[13px] text-error">
          {error}
        </div>
      )}

      <WizardNav onGenerate={handleGenerate} isGenerating={isGenerating} />
    </div>
  )
}
