import { ArrowLeft, ArrowRight, Sparkles, PencilLine } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useWizardStore, WIZARD_STEP_ORDER, validateStep } from '@/store/wizard-store'

export interface WizardNavProps {
  onGenerate: () => void
  onBuildManually: () => void
  isGenerating?: boolean
}

export function WizardNav({ onGenerate, onBuildManually, isGenerating = false }: WizardNavProps) {
  const currentStep = useWizardStore((s) => s.currentStep)
  const canAdvance = useWizardStore((s) => validateStep(s.currentStep, s.inputs))
  const nextStep = useWizardStore((s) => s.nextStep)
  const prevStep = useWizardStore((s) => s.prevStep)

  const idx = WIZARD_STEP_ORDER.indexOf(currentStep)
  const isFirst = idx === 0
  const isLast = idx === WIZARD_STEP_ORDER.length - 1

  return (
    <div className="flex flex-col gap-3 pt-4">
      <div className="flex items-center justify-between gap-3">
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
            {isGenerating ? 'Generating\u2026' : 'Generate with AI'}
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
      {isLast && (
        <button
          type="button"
          onClick={onBuildManually}
          disabled={!canAdvance || isGenerating}
          className="self-end flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <PencilLine size={14} />
          Or build manually (no AI)
        </button>
      )}
    </div>
  )
}
