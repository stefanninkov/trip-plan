import { Users } from 'lucide-react'
import { useWizardStore } from '@/store/wizard-store'
import { NumberStepper } from '@/components/shared/NumberStepper'

export function StepTravelers() {
  const travelers = useWizardStore((s) => s.inputs.travelers)
  const setField = useWizardStore((s) => s.setField)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">Step 4</p>
        <h2 className="flex items-center gap-2.5">
          <Users size={22} className="text-accent shrink-0" />
          How many travelers?
        </h2>
        <p className="text-text-secondary">
          All costs in the plan will be calculated as a total for the group.
        </p>
      </div>

      <NumberStepper
        value={travelers}
        min={1}
        max={20}
        onChange={(v) => setField('travelers', v)}
        suffix={travelers === 1 ? 'person' : 'people'}
      />
    </div>
  )
}
