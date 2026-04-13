import { Map, Plus, Trash2 } from 'lucide-react'
import { useWizardStore } from '@/store/wizard-store'
import { Input } from '@/components/shared/Input'
import { NumberStepper } from '@/components/shared/NumberStepper'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'

export function StepDestinations() {
  const destinations = useWizardStore((s) => s.inputs.destinations)
  const addDestination = useWizardStore((s) => s.addDestination)
  const updateDestination = useWizardStore((s) => s.updateDestination)
  const removeDestination = useWizardStore((s) => s.removeDestination)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">Step 2</p>
        <h2 className="flex items-center gap-2.5">
          <Map size={22} className="text-accent shrink-0" />
          Where do you want to go?
        </h2>
        <p className="text-text-secondary">
          Add one or more cities in the order you want to visit them. Set how many nights
          you'll spend in each.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {destinations.map((dest, index) => (
          <Card key={index} className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 min-w-0">
              <Input
                label={`City ${index + 1}`}
                placeholder="e.g. Rome, Italy"
                value={dest.city}
                onChange={(e) => updateDestination(index, { city: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-2">
              <NumberStepper
                label="Nights"
                value={dest.nights}
                min={1}
                max={30}
                onChange={(v) => updateDestination(index, { nights: v })}
              />
              {destinations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDestination(index)}
                  aria-label={`Remove ${dest.city || 'destination'}`}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-text-tertiary hover:bg-bg-elevated hover:text-error transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={addDestination}
        className="flex items-center gap-1.5 self-start"
      >
        <Plus size={14} />
        Add another city
      </Button>
    </div>
  )
}
