import { useWizardStore, WIZARD_STEP_ORDER } from '@/store/wizard-store'
import { cn } from '@/utils/cn'

const STEP_LABELS: Record<(typeof WIZARD_STEP_ORDER)[number], string> = {
  origin: 'Origin',
  destinations: 'Destinations',
  dates: 'Dates',
  travelers: 'Travelers',
  advanced: 'Details',
}

export function WizardProgress() {
  const currentStep = useWizardStore((s) => s.currentStep)
  const goToStep = useWizardStore((s) => s.goToStep)
  const isValid = useWizardStore((s) => s.isValid)
  const currentIndex = WIZARD_STEP_ORDER.indexOf(currentStep)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        {WIZARD_STEP_ORDER.map((step, idx) => {
          const active = idx === currentIndex
          const reached = idx <= currentIndex
          return (
            <div
              key={step}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-200',
                reached ? 'bg-accent' : 'bg-border-subtle',
                active && 'bg-accent'
              )}
            />
          )
        })}
      </div>
      <div className="flex items-center justify-between text-[12px] text-text-tertiary">
        <span className="font-cost">
          Step {currentIndex + 1} of {WIZARD_STEP_ORDER.length}
        </span>
        <div className="flex items-center gap-3">
          {WIZARD_STEP_ORDER.map((step, idx) => {
            const reached = idx < currentIndex
            const canJump = reached || (idx === currentIndex + 1 && isValid(currentStep))
            return (
              <button
                key={step}
                type="button"
                onClick={() => canJump && goToStep(step)}
                disabled={!canJump && idx !== currentIndex}
                className={cn(
                  'text-[12px] font-medium tracking-[0.1px]',
                  idx === currentIndex
                    ? 'text-accent'
                    : reached
                      ? 'text-text-secondary hover:text-text-primary'
                      : 'text-text-tertiary pointer-events-none'
                )}
              >
                {STEP_LABELS[step]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
