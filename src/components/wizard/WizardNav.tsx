import { ArrowLeft, ArrowRight, Sparkles, Globe, PencilLine } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'
import { useWizardStore, WIZARD_STEP_ORDER, validateStep } from '@/store/wizard-store'

export interface WizardNavProps {
  onGenerate: () => void
  onBuildFromSearch: () => void
  onBuildManually: () => void
  isGenerating?: boolean
}

export function WizardNav({
  onGenerate,
  onBuildFromSearch,
  onBuildManually,
  isGenerating = false,
}: WizardNavProps) {
  const { t } = useTranslation()
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
          {t('common.back')}
        </Button>

        {isLast ? (
          <Button
            type="button"
            onClick={onGenerate}
            disabled={!canAdvance || isGenerating}
            className="flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            {isGenerating ? t('wizard.generating') : t('wizard.generateWithAi')}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={nextStep}
            disabled={!canAdvance}
            className="flex items-center gap-1.5"
          >
            {t('common.next')}
            <ArrowRight size={14} />
          </Button>
        )}
      </div>
      {isLast && (
        <div className="flex items-center gap-3 self-end">
          <button
            type="button"
            onClick={onBuildFromSearch}
            disabled={!canAdvance || isGenerating}
            className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Globe size={14} />
            {t('wizard.buildFromSearch')}
          </button>
          <button
            type="button"
            onClick={onBuildManually}
            disabled={!canAdvance || isGenerating}
            className="flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <PencilLine size={14} />
            {t('wizard.startBlank')}
          </button>
        </div>
      )}
    </div>
  )
}
