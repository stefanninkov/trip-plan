import { MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useWizardStore } from '@/store/wizard-store'
import { CityAutocomplete } from '@/components/shared/CityAutocomplete'
import { RecentDestinationChips } from '@/components/shared/RecentDestinationChips'
import { rememberDestination } from '@/utils/recent-destinations'

export function StepOrigin() {
  const { t } = useTranslation()
  const origin = useWizardStore((s) => s.inputs.origin)
  const originCountry = useWizardStore((s) => s.inputs.originCountry)
  const setField = useWizardStore((s) => s.setField)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">{t('wizard.stepOrigin')}</p>
        <h2 className="flex items-center gap-2.5">
          <MapPin size={22} className="text-accent shrink-0" />
          {t('wizard.originHeading')}
        </h2>
        <p className="text-text-secondary">{t('wizard.originDescription')}</p>
      </div>
      <CityAutocomplete
        name="origin"
        value={origin}
        onChange={(v) => {
          setField('origin', v)
          if (originCountry) setField('originCountry', '')
        }}
        onSelect={(s) => {
          setField('origin', s.displayName)
          setField('originCountry', s.country)
          rememberDestination(
            {
              city: s.city,
              country: s.country,
              displayName: s.displayName,
            },
            'origin'
          )
        }}
        placeholder={t('wizard.originPlaceholder')}
        autoFocus
      />
      <RecentDestinationChips
        kind="origin"
        exclude={origin ? [origin] : []}
        onPick={(r) => {
          setField('origin', r.displayName)
          setField('originCountry', r.country)
          rememberDestination(
            {
              city: r.city,
              country: r.country,
              displayName: r.displayName,
            },
            'origin'
          )
        }}
      />
      {!originCountry && origin.length >= 2 && (
        <p className="text-[12px] text-text-tertiary">{t('wizard.pickSuggestion')}</p>
      )}
    </div>
  )
}
