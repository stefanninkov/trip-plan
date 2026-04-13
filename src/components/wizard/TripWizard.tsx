import { useNavigate } from 'react-router-dom'
import { useWizardStore } from '@/store/wizard-store'
import { useUiStore } from '@/store/ui-store'
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
  const addToast = useUiStore((s) => s.addToast)
  const navigate = useNavigate()

  const handleGenerate = (): void => {
    // Phase C will wire this to the Claude API Cloud Function.
    addToast('info', 'Trip generation will be wired in Phase C.')
    navigate(ROUTES.home)
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

      <WizardNav onGenerate={handleGenerate} />
    </div>
  )
}
