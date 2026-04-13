import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useWizardStore, WIZARD_STEP_ORDER } from '@/store/wizard-store'

export interface WizardNavProps {
  onGenerate: () => void
  isGenerating?: boolean
}

export function WizardNav({ onGenerate, isGenerating = false }: WizardNavProps) {
  const currentStep = useWizardStore((s) => s.currentStep)
  const nextStep = useWizardStore((s) => s.nextStep)
  const prevStep = useWizardStore((s) => s.prevStep)
  const isValid = useWizardStore((s) => s.isValid)

  const idx = WIZARD_STEP_ORDER.indexOf(currentStep)
  const isFirst = idx === 0
  const isLast = idx === WIZARD_STEP_ORDER.length - 1
  const canAdvance = isValid(currentStep)

  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <Button
        type="button"
        variant="secondary"
        onClick={prevStep}
        disabled={isFirst || isGenerating}
        className="flex items-center gap-1.5"
      >
        <ArrowLeft size={14} />
        Back
      </Button>

      {isLast ? (
        <Button
          type="button"
          onClick={onGenerate}
          disabled={!canAdvance || isGenerating}
          className="flex items-center gap-1.5"
        >
          <Sparkles size={14} />
          {isGenerating ? 'Generating\u2026' : 'Generate plan'}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={nextStep}
          disabled={!canAdvance}
          className="flex items-center gap-1.5"
        >
          Next
          <ArrowRight size={14} />
        </Button>
      )}
    </div>
  )
}
