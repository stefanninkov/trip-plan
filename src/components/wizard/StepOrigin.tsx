import { MapPin } from 'lucide-react'
import { useWizardStore } from '@/store/wizard-store'
import { CityAutocomplete } from '@/components/shared/CityAutocomplete'

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
          Search for your departure city. Pick a result, or type freely and continue.
        </p>
      </div>
      <CityAutocomplete
        name="origin"
        value={origin}
        onChange={(v) => setField('origin', v)}
        onSelect={(s) => setField('origin', s.displayName)}
        placeholder="e.g. Belgrade, Serbia"
        autoFocus
      />
    </div>
  )
}
