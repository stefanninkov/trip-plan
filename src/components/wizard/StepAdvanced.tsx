import { useState } from 'react'
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react'
import { useWizardStore } from '@/store/wizard-store'
import { Input } from '@/components/shared/Input'
import { Select, type SelectOption } from '@/components/shared/Select'
import { Card } from '@/components/shared/Card'
import { cn } from '@/utils/cn'
import { BUDGET_LEVELS } from '@/constants/budget-levels'
import { INTEREST_TAGS } from '@/constants/interests'
import { PACE_OPTIONS, ACCOMMODATION_OPTIONS } from '@/constants/pace'
import { CURRENCIES } from '@/constants/currencies'
import type { BudgetTier } from '@/types/trip-plan'
import type { AccommodationPref, PacePreference } from '@/types/wizard'

const ACCOMMODATION_MULTI = ACCOMMODATION_OPTIONS.filter((o) => o.value !== 'any')

const CURRENCY_OPTIONS: SelectOption[] = CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.code} \u2014 ${c.name}`,
}))

export function StepAdvanced() {
  const inputs = useWizardStore((s) => s.inputs)
  const setField = useWizardStore((s) => s.setField)
  const toggleInterest = useWizardStore((s) => s.toggleInterest)
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">Step 5</p>
        <h2 className="flex items-center gap-2.5">
          <Settings2 size={22} className="text-accent shrink-0" />
          Fine-tune your plan
        </h2>
        <p className="text-text-secondary">
          Pick a budget tier and what you care about. Everything else is optional.
        </p>
      </div>

      {/* === Essentials in the advanced step === */}
      <div className="flex flex-col gap-3">
        <span className="text-[13px] font-medium text-text-secondary tracking-[0.2px]">
          Budget tier
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {BUDGET_LEVELS.map((level) => {
            const active = inputs.budgetLevel === level.id
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => setField('budgetLevel', level.id as BudgetTier)}
                className={cn(
                  'text-left p-3 rounded-xl border transition-colors duration-150',
                  active
                    ? 'border-accent bg-accent-muted'
                    : 'border-border-subtle bg-bg-surface hover:bg-bg-elevated hover:border-border-default'
                )}
              >
                <div
                  className={cn(
                    'text-[14px] font-semibold mb-1',
                    active ? 'text-accent' : 'text-text-primary'
                  )}
                >
                  {level.label}
                </div>
                <div className="text-[12px] text-text-tertiary leading-snug">
                  {level.description}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[13px] font-medium text-text-secondary tracking-[0.2px]">
          Interests (optional)
        </span>
        <div className="flex flex-wrap gap-2">
          {INTEREST_TAGS.map((tag) => {
            const active = inputs.interests.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleInterest(tag)}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-[12px] font-medium transition-colors duration-150',
                  active
                    ? 'border-accent bg-accent-muted text-accent'
                    : 'border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary'
                )}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* === Progressive disclosure === */}
      <button
        type="button"
        onClick={() => setShowMore((s) => !s)}
        className="self-start flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
      >
        {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showMore ? 'Hide advanced options' : 'Add more details'}
      </button>

      {showMore && (
        <Card className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Pace"
              name="pace"
              value={inputs.pace}
              onChange={(e) => setField('pace', e.target.value as PacePreference)}
              options={PACE_OPTIONS}
            />
            <AccommodationPicker
              value={inputs.accommodationType}
              onChange={(v) => setField('accommodationType', v)}
            />
          </div>

          <Select
            label="Your home currency"
            name="homeCurrency"
            value={inputs.homeCurrency}
            onChange={(e) => setField('homeCurrency', e.target.value)}
            options={CURRENCY_OPTIONS}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Dietary needs"
              name="dietaryNeeds"
              placeholder="e.g. vegetarian, gluten-free"
              value={inputs.dietaryNeeds}
              onChange={(e) => setField('dietaryNeeds', e.target.value)}
            />
            <Input
              label="Mobility notes"
              name="mobilityNotes"
              placeholder="e.g. limited walking, stroller"
              value={inputs.mobilityNotes}
              onChange={(e) => setField('mobilityNotes', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="notes"
              className="text-[13px] font-medium text-text-secondary tracking-[0.2px]"
            >
              Anything else?
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="e.g. avoid very touristy spots, include a day trip, want to see the northern lights"
              value={inputs.notes}
              onChange={(e) => setField('notes', e.target.value)}
              className="bg-bg-secondary text-text-primary placeholder:text-text-tertiary border border-border-default rounded-lg px-3 py-2.5 text-[14px] leading-[22px] focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-[var(--accent-muted)] transition-colors duration-150 resize-y"
            />
          </div>
        </Card>
      )}
    </div>
  )
}

function AccommodationPicker({
  value,
  onChange,
}: {
  value: AccommodationPref | AccommodationPref[]
  onChange: (v: AccommodationPref | AccommodationPref[]) => void
}) {
  const selected: AccommodationPref[] = Array.isArray(value)
    ? value
    : value === 'any' || !value
      ? []
      : [value]
  const noneSelected = selected.length === 0

  const toggle = (id: AccommodationPref): void => {
    if (selected.includes(id)) {
      const next = selected.filter((x) => x !== id)
      onChange(next.length === 0 ? 'any' : next)
    } else {
      onChange([...selected, id])
    }
  }
  const clear = () => onChange('any')

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-text-secondary tracking-[0.2px]">
          Accommodation preference
        </span>
        <button
          type="button"
          onClick={clear}
          className={cn(
            'text-[11px] transition-colors',
            noneSelected ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'
          )}
        >
          {noneSelected ? 'Any (selected)' : 'Any'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {ACCOMMODATION_MULTI.map((o) => {
          const active = selected.includes(o.value as AccommodationPref)
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value as AccommodationPref)}
              className={cn(
                'px-3 py-1.5 rounded-full border text-[12px] font-medium transition-colors duration-150',
                active
                  ? 'border-accent bg-accent-muted text-accent'
                  : 'border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary'
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
