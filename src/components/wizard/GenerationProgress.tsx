import { useTranslation } from 'react-i18next'
import { AiProgress } from '@/components/shared/AiProgress'

export function GenerationProgress() {
  const { t } = useTranslation()
  const STAGES = [
    { at: 0, label: t('generation.stage0') },
    { at: 10, label: t('generation.stage10') },
    { at: 25, label: t('generation.stage25') },
    { at: 45, label: t('generation.stage45') },
    { at: 65, label: t('generation.stage65') },
    { at: 80, label: t('generation.stage80') },
    { at: 92, label: t('generation.stage92') },
  ]
  return (
    <AiProgress
      stages={STAGES}
      timeConstant={22}
      hint={t('generation.hint')}
    />
  )
}
