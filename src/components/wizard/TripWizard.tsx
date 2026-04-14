import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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

export function TripWizard() {
  const { t } = useTranslation()
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

  const SEARCH_STAGES = [
    { at: 0, label: t('search.stage0') },
    { at: 25, label: t('search.stage25') },
    { at: 55, label: t('search.stage55') },
    { at: 80, label: t('search.stage80') },
    { at: 93, label: t('search.stage93') },
  ]

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
              {t('wizard.tooSlowBuildSearch')}
            </Button>
            <Button
              variant="ghost"
              onClick={handleBuildBlank}
              className="text-[12px]"
            >
              {t('wizard.startBlankInstead')}
            </Button>
          </div>
        </div>
      )}

      {isSearchBuilding && (
        <AiProgress stages={SEARCH_STAGES} timeConstant={6} hint={t('search.hint')} />
      )}

      {error && !isGenerating && (
        <div className="rounded-lg border border-error bg-[#D9555510] px-4 py-3 text-[13px] flex flex-col gap-3">
          <span className="text-error">{error}</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleGenerate}>
              {t('wizard.tryAiAgain')}
            </Button>
            <Button onClick={handleBuildFromSearch}>{t('wizard.buildFromSearch')}</Button>
            <Button variant="ghost" onClick={handleBuildBlank}>
              {t('wizard.startBlank')}
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
