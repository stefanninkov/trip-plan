import { useState } from 'react'
import { Mic, MicOff, Loader2, Sparkles, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useWizardStore } from '@/store/wizard-store'
import { useUiStore } from '@/store/ui-store'
import { FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { Button } from '@/components/shared/Button'
import { todayIso } from '@/utils/date-helpers'
import { logger } from '@/utils/logger'
import type { TripInputs, Destination } from '@/types/wizard'

/**
 * Large mic button that opens a voice-dictation popover. When the user
 * stops, the transcript is sent to parseWizardVoice which returns
 * structured TripInputs; we then merge them into the wizard store so
 * the user can just review + Generate.
 */
export function VoiceWizardButton() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [parsing, setParsing] = useState(false)
  const setInputs = useWizardStore((s) => s.setInputs)
  const currentInputs = useWizardStore((s) => s.inputs)
  const addToast = useUiStore((s) => s.addToast)
  const lang = (i18n.resolvedLanguage ?? 'en').startsWith('sr') ? 'sr' : 'en'
  const { supported, listening, transcript, error, start, stop, reset } = useVoiceInput(lang)

  if (!supported) return null

  const apply = async (): Promise<void> => {
    if (!transcript.trim()) {
      setOpen(false)
      return
    }
    if (!FUNCTIONS_BASE_URL) {
      addToast('error', 'Backend not configured')
      return
    }
    setParsing(true)
    try {
      const res = await fetch(`${FUNCTIONS_BASE_URL}/parseWizardVoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, today: todayIso() }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { inputs } = (await res.json()) as { inputs: Partial<TripInputs> }
      const next: TripInputs = {
        ...currentInputs,
        ...inputs,
        destinations:
          inputs.destinations && inputs.destinations.length > 0
            ? (inputs.destinations as Destination[])
            : currentInputs.destinations,
        homeCurrency: currentInputs.homeCurrency,
      }
      setInputs(next)
      addToast('success', t('voice.filled'))
      setOpen(false)
      reset()
    } catch (err) {
      logger.error('voice parse failed', err)
      addToast('error', t('voice.parseFailed'))
    } finally {
      setParsing(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-default bg-bg-secondary text-[12px] text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors"
      >
        <Mic size={13} />
        {t('voice.buttonLabel')}
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-accent/50 bg-accent-muted/15 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[12px] uppercase tracking-[1px] text-accent font-semibold">
          <Sparkles size={12} />
          {t('voice.title')}
        </div>
        <button
          type="button"
          onClick={() => {
            stop()
            setOpen(false)
            reset()
          }}
          aria-label={t('common.close')}
          className="text-text-tertiary hover:text-text-primary p-1"
        >
          <X size={14} />
        </button>
      </div>
      <p className="text-[12px] text-text-secondary leading-[18px]">{t('voice.hint')}</p>

      <div className="min-h-[72px] rounded-lg border border-border-subtle bg-bg-surface p-3 text-[14px] text-text-primary leading-[20px] whitespace-pre-wrap">
        {transcript || (
          <span className="text-text-tertiary">
            {listening ? t('voice.listening') : t('voice.tapToStart')}
          </span>
        )}
      </div>

      {error && <span className="text-[12px] text-error">{error}</span>}

      <div className="flex items-center justify-between gap-2">
        {listening ? (
          <Button variant="secondary" onClick={stop} className="flex items-center gap-1.5">
            <MicOff size={14} />
            {t('voice.stop')}
          </Button>
        ) : (
          <Button onClick={start} className="flex items-center gap-1.5">
            <Mic size={14} />
            {transcript ? t('voice.recordAgain') : t('voice.start')}
          </Button>
        )}
        <Button
          variant="primary"
          onClick={() => void apply()}
          disabled={!transcript.trim() || parsing || listening}
          className="flex items-center gap-1.5"
        >
          {parsing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {parsing ? t('voice.parsing') : t('voice.apply')}
        </Button>
      </div>
    </div>
  )
}
