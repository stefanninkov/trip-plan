import { MapPin } from 'lucide-react'
import { useWizardStore } from '@/store/wizard-store'
import { Input } from '@/components/shared/Input'

export function StepOrigin() {
  const origin = useWizardStore((s) => s.inputs.origin)
  const setField = useWizardStore((s) => s.setField)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">Step 1</p>
        <h2 className="flex items-center gap-2.5">
          <MapPin size={22} className="text-accent shrink-0" />
          Where are you starting from?
        </h2>
        <p className="text-text-secondary">
          The city or airport where your trip begins. Example:{' '}
          <span className="text-text-primary">Belgrade</span>,{' '}
          <span className="text-text-primary">BEG</span>, or{' '}
          <span className="text-text-primary">Belgrade, Serbia</span>.
        </p>
      </div>
      <Input
        name="origin"
        placeholder="e.g. Belgrade, Serbia"
        value={origin}
        onChange={(e) => setField('origin', e.target.value)}
        autoFocus
      />
    </div>
  )
}
