import { CalendarDays } from 'lucide-react'
import { useWizardStore } from '@/store/wizard-store'
import { Input } from '@/components/shared/Input'
import { daysBetween, formatDateRange } from '@/utils/date-helpers'

export function StepDates() {
  const startDate = useWizardStore((s) => s.inputs.startDate)
  const endDate = useWizardStore((s) => s.inputs.endDate)
  const setField = useWizardStore((s) => s.setField)

  const days = daysBetween(startDate, endDate)
  const invalid = startDate && endDate && new Date(endDate).getTime() <= new Date(startDate).getTime()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">Step 3</p>
        <h2 className="flex items-center gap-2.5">
          <CalendarDays size={22} className="text-accent shrink-0" />
          When is the trip?
        </h2>
        <p className="text-text-secondary">
          Pick your departure and return dates. The AI will build a day-by-day plan inside this
          window.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Start date"
          type="date"
          name="startDate"
          value={startDate}
          onChange={(e) => setField('startDate', e.target.value)}
        />
        <Input
          label="End date"
          type="date"
          name="endDate"
          value={endDate}
          onChange={(e) => setField('endDate', e.target.value)}
          error={invalid ? 'End date must be after start date' : undefined}
        />
      </div>

      {!invalid && startDate && endDate && (
        <div className="rounded-lg border border-border-subtle bg-bg-secondary px-4 py-3 text-[13px] text-text-secondary">
          <span className="text-text-primary font-semibold">{days} days</span>
          {' \u00B7 '}
          {formatDateRange(startDate, endDate)}
        </div>
      )}
    </div>
  )
}
