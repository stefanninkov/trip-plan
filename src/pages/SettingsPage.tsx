import { Settings, RefreshCw, Trash2, Download, Thermometer, Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { LanguageToggle } from '@/components/shared/LanguageToggle'
import { usePrefsStore } from '@/store/prefs-store'
import { useUiStore } from '@/store/ui-store'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { prefetchRates } from '@/utils/currency-rates'
import { clearRecentDestinations } from '@/utils/recent-destinations'
import { clearExploreHistory } from '@/utils/explore-history'
import { cn } from '@/utils/cn'

export function SettingsPage() {
  const { t } = useTranslation()
  const tempUnit = usePrefsStore((s) => s.tempUnit)
  const setTempUnit = usePrefsStore((s) => s.setTempUnit)
  const addToast = useUiStore((s) => s.addToast)
  const { canInstall, installed, promptInstall } = useInstallPrompt()

  const refreshRates = async (): Promise<void> => {
    try {
      // Force a fresh fetch by flushing the current localStorage entry.
      localStorage.removeItem('trip-plan.rates')
      await prefetchRates('EUR')
      await prefetchRates('USD')
      addToast('success', t('settings.ratesRefreshed'))
    } catch {
      addToast('error', t('settings.ratesFailed'))
    }
  }

  const doInstall = async (): Promise<void> => {
    const outcome = await promptInstall()
    if (outcome === 'accepted') addToast('success', t('settings.installed'))
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">
          {t('settings.heading')}
        </p>
        <h1 className="flex items-center gap-2.5">
          <Settings size={24} className="text-accent" />
          {t('settings.heading')}
        </h1>
        <p className="text-text-secondary">{t('settings.description')}</p>
      </header>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <Thermometer size={16} className="text-accent" />
          {t('settings.units')}
        </div>
        <p className="text-[12px] text-text-tertiary">{t('settings.unitsDescription')}</p>
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] text-text-secondary uppercase tracking-[0.5px]">
            {t('settings.temperature')}
          </span>
          <div className="inline-flex items-center rounded-full border border-border-subtle bg-bg-secondary p-0.5 self-start">
            {(['C', 'F'] as const).map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => setTempUnit(unit)}
                className={cn(
                  'px-3 py-1 rounded-full text-[12px] font-semibold transition-colors',
                  tempUnit === unit
                    ? 'bg-accent text-bg-primary'
                    : 'text-text-tertiary hover:text-text-primary'
                )}
              >
                {unit === 'C' ? t('settings.celsius') : t('settings.fahrenheit')}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <Bell size={16} className="text-accent" />
          {t('common.language')}
        </div>
        <LanguageToggle />
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <RefreshCw size={16} className="text-accent" />
          {t('settings.currency')}
        </div>
        <p className="text-[12px] text-text-tertiary">{t('settings.currencyDescription')}</p>
        <Button variant="secondary" onClick={refreshRates} className="self-start flex items-center gap-1.5">
          <RefreshCw size={14} />
          {t('settings.refreshRates')}
        </Button>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <Trash2 size={16} className="text-accent" />
          {t('settings.caches')}
        </div>
        <p className="text-[12px] text-text-tertiary">{t('settings.cachesDescription')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              clearExploreHistory()
              addToast('info', t('settings.exploreCleared'))
            }}
            className="flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            {t('settings.clearExplore')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              clearRecentDestinations()
              addToast('info', t('settings.recentsCleared'))
            }}
            className="flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            {t('settings.clearRecents')}
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <Download size={16} className="text-accent" />
          {t('settings.installApp')}
        </div>
        <p className="text-[12px] text-text-tertiary">{t('settings.installDescription')}</p>
        {installed ? (
          <p className="text-[12px] text-accent">{t('settings.alreadyInstalled')}</p>
        ) : (
          <Button
            variant="secondary"
            disabled={!canInstall}
            onClick={() => void doInstall()}
            className="self-start flex items-center gap-1.5"
          >
            <Download size={14} />
            {t('settings.installApp')}
          </Button>
        )}
      </Card>
    </div>
  )
}
