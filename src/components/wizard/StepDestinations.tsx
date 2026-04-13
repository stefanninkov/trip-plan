import { useState } from 'react'
import { Map, Plus, Trash2, CalendarRange, ListOrdered } from 'lucide-react'
import { useWizardStore } from '@/store/wizard-store'
import { CityAutocomplete } from '@/components/shared/CityAutocomplete'
import { NumberStepper } from '@/components/shared/NumberStepper'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { Input } from '@/components/shared/Input'
import { daysBetween } from '@/utils/date-helpers'
import { cn } from '@/utils/cn'
import type { Destination } from '@/types/wizard'

type Mode = 'nights' | 'dates'

export function StepDestinations() {
  const destinations = useWizardStore((s) => s.inputs.destinations)
  const tripStart = useWizardStore((s) => s.inputs.startDate)
  const tripEnd = useWizardStore((s) => s.inputs.endDate)
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
          Add cities in the order you want to visit. Choose nights or precise dates per stop.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {destinations.map((dest, index) => (
          <DestinationCard
            key={index}
            index={index}
            destination={dest}
            canRemove={destinations.length > 1}
            tripStart={tripStart}
            tripEnd={tripEnd}
            onChange={(patch) => updateDestination(index, patch)}
            onRemove={() => removeDestination(index)}
          />
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

interface DestinationCardProps {
  index: number
  destination: Destination
  canRemove: boolean
  tripStart: string
  tripEnd: string
  onChange: (patch: Partial<Destination>) => void
  onRemove: () => void
}

function DestinationCard({
  index,
  destination,
  canRemove,
  tripStart,
  tripEnd,
  onChange,
  onRemove,
}: DestinationCardProps) {
  const initialMode: Mode =
    destination.startDate && destination.endDate ? 'dates' : 'nights'
  const [mode, setMode] = useState<Mode>(initialMode)
  const needsPick = destination.city.length >= 2 && !destination.country

  const handleModeChange = (next: Mode) => {
    setMode(next)
    if (next === 'nights') {
      onChange({ startDate: undefined, endDate: undefined })
    }
  }

  const setDate = (field: 'startDate' | 'endDate', value: string) => {
    const updated = { ...destination, [field]: value }
    if (updated.startDate && updated.endDate) {
      const n = daysBetween(updated.startDate, updated.endDate)
      if (n > 0) {
        onChange({ [field]: value, nights: n })
        return
      }
    }
    onChange({ [field]: value })
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1 min-w-0">
          <CityAutocomplete
            name={`destination-${index}`}
            label={`Stop ${index + 1}`}
            value={destination.city}
            onChange={(v) => {
              onChange({ city: v })
              if (destination.country) onChange({ country: '' })
            }}
            onSelect={(s) => onChange({ city: s.displayName, country: s.country })}
            placeholder="e.g. Rome, Italy"
          />
        </div>

        <ModeToggle mode={mode} onChange={handleModeChange} />

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove stop ${index + 1}`}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-text-tertiary hover:bg-bg-elevated hover:text-error transition-colors self-start md:self-end"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {mode === 'nights' ? (
        <div className="flex items-end gap-3">
          <NumberStepper
            label="Nights"
            value={destination.nights}
            min={1}
            max={30}
            onChange={(v) => onChange({ nights: v })}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Arrive"
            type="date"
            value={destination.startDate ?? ''}
            min={tripStart || undefined}
            max={tripEnd || undefined}
            onChange={(e) => setDate('startDate', e.target.value)}
          />
          <Input
            label="Leave"
            type="date"
            value={destination.endDate ?? ''}
            min={destination.startDate ?? tripStart ?? undefined}
            max={tripEnd || undefined}
            onChange={(e) => setDate('endDate', e.target.value)}
            error={
              destination.startDate &&
              destination.endDate &&
              new Date(destination.endDate).getTime() <=
                new Date(destination.startDate).getTime()
                ? 'Leave must be after arrive'
                : undefined
            }
          />
          {destination.startDate && destination.endDate && (
            <div className="md:col-span-2 text-[12px] text-text-tertiary">
              Auto-calculated nights: <span className="text-text-primary font-semibold">{destination.nights}</span>
            </div>
          )}
        </div>
      )}

      {needsPick && (
        <p className="text-[12px] text-text-tertiary">
          Pick one of the suggestions to confirm this stop.
        </p>
      )}
    </Card>
  )
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (next: Mode) => void }) {
  return (
    <div className="inline-flex items-center gap-0 bg-bg-secondary border border-border-default rounded-lg p-0.5 self-start md:self-end">
      <ToggleButton
        active={mode === 'nights'}
        onClick={() => onChange('nights')}
        icon={ListOrdered}
        label="Nights"
      />
      <ToggleButton
        active={mode === 'dates'}
        onClick={() => onChange('dates')}
        icon={CalendarRange}
        label="Dates"
      />
    </div>
  )
}

function ToggleButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof ListOrdered
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors',
        active
          ? 'bg-bg-elevated text-text-primary'
          : 'text-text-tertiary hover:text-text-secondary'
      )}
    >
      <Icon size={12} />
      {label}
    </button>
  )
}
