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
import { GenerationProgress } from './GenerationProgress'
import { AiProgress } from '@/components/shared/AiProgress'
import { Button } from '@/components/shared/Button'
import { ROUTES } from '@/constants/routes'

const SEARCH_STAGES = [
  { at: 0, label: 'Searching hotels for each city' },
  { at: 25, label: 'Finding top places & restaurants' },
  { at: 55, label: 'Looking up flights' },
  { at: 80, label: 'Composing day blocks' },
  { at: 93, label: 'Finalising' },
]

export function TripWizard() {
  const currentStep = useWizardStore((s) => s.currentStep)
  const inputs = useWizardStore((s) => s.inputs)
  const addToast = useUiStore((s) => s.addToast)
  const setCurrent = useTripStore((s) => s.setCurrent)
  const navigate = useNavigate()
  const {
    isGenerating,
    generate,
    generateFromSearch,
    createBlank,
    error,
    clearError,
    searchProgress,
  } = useGenerateTrip()

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

  const handleBuildFromSearch = async (): Promise<void> => {
    clearError()
    const finalInputs = tripInputsWithDerivedDates(inputs)
    const result = await generateFromSearch(finalInputs)
    if (result) {
      setCurrent(result.tripId, result.plan)
      addToast('success', 'Trip built from Google search')
      navigate(ROUTES.trip(result.tripId))
    }
  }

  const handleBuildBlank = async (): Promise<void> => {
    clearError()
    const finalInputs = tripInputsWithDerivedDates(inputs)
    const result = await createBlank(finalInputs)
    if (result) {
      setCurrent(result.tripId, result.plan)
      addToast('info', 'Blank trip created. Fill it in as you go.')
      navigate(ROUTES.trip(result.tripId))
    }
  }

  const isSearchBuilding = Boolean(searchProgress)

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

      {isGenerating && !isSearchBuilding && (
        <div className="flex flex-col gap-3">
          <GenerationProgress />
          <div className="flex gap-2 self-start">
            <Button
              variant="secondary"
              onClick={handleBuildFromSearch}
              className="text-[12px]"
            >
              Too slow? Build without AI (Google search)
            </Button>
            <Button
              variant="ghost"
              onClick={handleBuildBlank}
              className="text-[12px]"
            >
              Start blank instead
            </Button>
          </div>
        </div>
      )}

      {isSearchBuilding && (
        <AiProgress
          stages={SEARCH_STAGES}
          timeConstant={6}
          hint="Building your trip from real hotel, place and flight search results."
        />
      )}

      {error && !isGenerating && (
        <div className="rounded-lg border border-error bg-[#D9555510] px-4 py-3 text-[13px] flex flex-col gap-3">
          <span className="text-error">{error}</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleGenerate}>
              Try AI again
            </Button>
            <Button onClick={handleBuildFromSearch}>Build from Google search</Button>
            <Button variant="ghost" onClick={handleBuildBlank}>
              Start blank
            </Button>
          </div>
        </div>
      )}

      <WizardNav
        onGenerate={handleGenerate}
        onBuildFromSearch={handleBuildFromSearch}
        onBuildManually={handleBuildBlank}
        isGenerating={isGenerating}
      />
    </div>
  )
}
