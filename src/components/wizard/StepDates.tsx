import { CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useWizardStore } from '@/store/wizard-store'
import { DateRangePicker } from '@/components/shared/DateRangePicker'
import { daysBetween, formatDateRange } from '@/utils/date-helpers'
import type { Destination } from '@/types/wizard'
import type { TravelMode } from '@/types/trip-plan'
import { TRAVEL_MODES, TRAVEL_MODE_LIST } from '@/constants/travel-modes'
import { cn } from '@/utils/cn'

export function StepDates() {
  const { t } = useTranslation()
  const destinations = useWizardStore((s) => s.inputs.destinations)
  const origin = useWizardStore((s) => s.inputs.origin)
  const updateDestination = useWizardStore((s) => s.updateDestination)

  // Trip total is the range from the first stop's start to the last stop's end
  const firstStart = destinations[0]?.startDate ?? ''
  const lastEnd = destinations[destinations.length - 1]?.endDate ?? ''
  const totalDays =
    firstStart && lastEnd && new Date(lastEnd) > new Date(firstStart)
      ? daysBetween(firstStart, lastEnd) + 1
      : 0

  const setRange = (index: number, start: string, end: string) => {
    const patch: Partial<Destination> = { startDate: start || undefined, endDate: end || undefined }
    if (start && end) {
      const n = daysBetween(start, end)
      if (n > 0) patch.nights = n
    } else {
      patch.nights = 0
    }
    updateDestination(index, patch)

    // Auto-chain: setting an end date populates the next stop's arrive if
    // empty, so ranges stay contiguous by default.
    if (end) {
      const next = destinations[index + 1]
      if (next && !next.startDate) {
        updateDestination(index + 1, { startDate: end })
      }
    }
  }

  const setArrivalMode = (index: number, mode: TravelMode | undefined) => {
    updateDestination(index, { arrivalMode: mode })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">{t('wizard.stepDates')}</p>
        <h2 className="flex items-center gap-2.5">
          <CalendarDays size={22} className="text-accent shrink-0" />
          {t('wizard.datesHeading')}
        </h2>
        <p className="text-text-secondary">{t('wizard.datesDescription')}</p>
      </div>

      <div className="flex flex-col gap-3">
        {destinations.map((d, i) => {
          const invalid =
            d.startDate &&
            d.endDate &&
            new Date(d.endDate).getTime() <= new Date(d.startDate).getTime()
          const fromLabel =
            i === 0
              ? origin.trim() || t('wizard.yourOrigin')
              : destinations[i - 1].city || t('wizard.stop', { n: i })
          const toLabel = d.city || t('wizard.stop', { n: i + 1 })
          return (
            <div
              key={i}
              className="bg-bg-surface border border-border-subtle rounded-xl p-3 lg:p-4 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-accent-muted text-accent font-cost font-bold flex items-center justify-center shrink-0 text-[12px]">
                  {i + 1}
                </span>
                <span className="text-[14px] font-semibold text-text-primary truncate">
                  {d.city || t('wizard.stop', { n: i + 1 })}
                </span>
              </div>
              <DateRangePicker
                startDate={d.startDate ?? ''}
                endDate={d.endDate ?? ''}
                onChange={(s, e) => setRange(i, s, e)}
                minDate={i === 0 ? undefined : destinations[i - 1].startDate}
                title={`${t('wizard.stop', { n: i + 1 })}: ${toLabel}`}
                error={invalid ? t('wizard.leaveAfterArrive') : undefined}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-text-secondary tracking-[0.2px]">
                  {t('wizard.howYouTravel', { from: fromLabel, to: toLabel })}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setArrivalMode(i, undefined)}
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-[12px] transition-colors',
                      !d.arrivalMode
                        ? 'border-accent bg-accent-muted text-accent'
                        : 'border-border-default bg-bg-secondary text-text-secondary hover:border-border-default hover:text-text-primary'
                    )}
                  >
                    {t('wizard.letAiPick')}
                  </button>
                  {TRAVEL_MODE_LIST.map((mode) => {
                    const Icon = mode.icon
                    const active = d.arrivalMode === mode.id
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setArrivalMode(i, mode.id)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] transition-colors',
                          active
                            ? 'border-accent bg-accent-muted text-accent'
                            : 'border-border-default bg-bg-secondary text-text-secondary hover:text-text-primary'
                        )}
                      >
                        <Icon size={13} />
                        {t(`travelMode.${mode.id}`, { defaultValue: mode.label })}
                      </button>
                    )
                  })}
                </div>
                {d.arrivalMode && (
                  <span className="text-[11px] text-text-tertiary">
                    {t('wizard.modeSelected', {
                      mode: t(`travelMode.${d.arrivalMode}`, {
                        defaultValue: TRAVEL_MODES[d.arrivalMode].label,
                      }),
                    })}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {totalDays > 0 && (
        <div className="rounded-lg border border-border-subtle bg-bg-secondary px-4 py-3 text-[13px] text-text-secondary">
          {t('wizard.tripTotal')}:{' '}
          <span className="text-text-primary font-semibold">
            {totalDays} {t('common.days')}
          </span>
          {' · '}
          {formatDateRange(firstStart, lastEnd)}
        </div>
      )}
    </div>
  )
}
