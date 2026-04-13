import { Map, Plus, Trash2 } from 'lucide-react'
import { useWizardStore } from '@/store/wizard-store'
import { CityAutocomplete } from '@/components/shared/CityAutocomplete'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { RecentDestinationChips } from '@/components/shared/RecentDestinationChips'
import { rememberDestination } from '@/utils/recent-destinations'

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
          Add cities in the order you want to visit. You&rsquo;ll pick the exact dates for each
          stop in the next step.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {destinations.map((dest, index) => {
          const needsPick = dest.city.length >= 2 && !dest.country
          return (
            <Card key={index} className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <CityAutocomplete
                    name={`destination-${index}`}
                    label={`Stop ${index + 1}`}
                    value={dest.city}
                    onChange={(v) => {
                      updateDestination(index, { city: v })
                      if (dest.country) updateDestination(index, { country: '' })
                    }}
                    onSelect={(s) => {
                      updateDestination(index, { city: s.displayName, country: s.country })
                      rememberDestination({
                        city: s.city,
                        country: s.country,
                        displayName: s.displayName,
                      })
                    }}
                    placeholder="e.g. Rome, Italy"
                  />
                  <RecentDestinationChips
                    exclude={destinations
                      .map((d) => d.city)
                      .filter((c) => c && c !== dest.city)}
                    onPick={(r) => {
                      updateDestination(index, {
                        city: r.displayName,
                        country: r.country,
                      })
                      rememberDestination({
                        city: r.city,
                        country: r.country,
                        displayName: r.displayName,
                      })
                    }}
                  />
                </div>
                {destinations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDestination(index)}
                    aria-label={`Remove stop ${index + 1}`}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-text-tertiary hover:bg-bg-elevated hover:text-error transition-colors self-start md:self-end"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {needsPick && (
                <p className="text-[12px] text-text-tertiary">
                  Pick one of the suggestions to confirm this stop.
                </p>
              )}
            </Card>
          )
        })}
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
