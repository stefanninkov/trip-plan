import { useNavigate } from 'react-router-dom'
import { useWizardStore, tripInputsWithDerivedDates } from '@/store/wizard-store'
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
import { Button } from '@/components/shared/Button'
import { ROUTES } from '@/constants/routes'

export function TripWizard() {
  const currentStep = useWizardStore((s) => s.currentStep)
  const inputs = useWizardStore((s) => s.inputs)
  const addToast = useUiStore((s) => s.addToast)
  const setCurrent = useTripStore((s) => s.setCurrent)
  const navigate = useNavigate()
  const { isGenerating, generate, createBlank, error, clearError } = useGenerateTrip()

  const handleGenerate = async (): Promise<void> => {
    clearError()
    const finalInputs = tripInputsWithDerivedDates(inputs)
    const result = await generate(finalInputs)
    if (result) {
      setCurrent(result.tripId, result.plan)
      addToast('success', 'Trip plan generated')
      navigate(ROUTES.trip(result.tripId))
    }
  }

  const handleBuildManually = async (): Promise<void> => {
    clearError()
    const finalInputs = tripInputsWithDerivedDates(inputs)
    const result = await createBlank(finalInputs)
    if (result) {
      setCurrent(result.tripId, result.plan)
      addToast('info', 'Blank trip created. Fill it in as you go.')
      navigate(ROUTES.trip(result.tripId))
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
        <div className="rounded-lg border border-border-subtle bg-bg-secondary px-4 py-3 text-[13px] text-text-secondary flex flex-col gap-3">
          <span>Working on your itinerary&hellip; this can take up to 60 seconds.</span>
          <Button variant="secondary" onClick={handleBuildManually}>
            Skip AI and build manually
          </Button>
        </div>
      )}

      {error && !isGenerating && (
        <div className="rounded-lg border border-error bg-[#D9555510] px-4 py-3 text-[13px] flex flex-col gap-3">
          <span className="text-error">{error}</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleGenerate}>
              Try AI again
            </Button>
            <Button onClick={handleBuildManually}>Build manually instead</Button>
          </div>
        </div>
      )}

      <WizardNav
        onGenerate={handleGenerate}
        onBuildManually={handleBuildManually}
        isGenerating={isGenerating}
      />
    </div>
  )
}
