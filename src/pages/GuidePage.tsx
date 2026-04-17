import { Link } from 'react-router-dom'
import {
  BookOpen,
  Sparkles,
  Compass,
  Globe,
  Pencil,
  CloudSun,
  Bell,
  Share2,
  Download,
  Languages,
  Lightbulb,
  Shield,
  Users,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/shared/Button'

interface GuideSection {
  icon: LucideIcon
  titleKey: string
  bodyKey: string
  tipsKey?: string
  cta?: { labelKey: string; to: string }
}

const SECTIONS: GuideSection[] = [
  {
    icon: Sparkles,
    titleKey: 'guide.planAi.title',
    bodyKey: 'guide.planAi.body',
    tipsKey: 'guide.planAi.tips',
    cta: { labelKey: 'guide.planAi.cta', to: ROUTES.newTrip },
  },
  {
    icon: Compass,
    titleKey: 'guide.explore.title',
    bodyKey: 'guide.explore.body',
    tipsKey: 'guide.explore.tips',
    cta: { labelKey: 'guide.explore.cta', to: ROUTES.explore },
  },
  {
    icon: Globe,
    titleKey: 'guide.noAi.title',
    bodyKey: 'guide.noAi.body',
    tipsKey: 'guide.noAi.tips',
  },
  {
    icon: Pencil,
    titleKey: 'guide.edit.title',
    bodyKey: 'guide.edit.body',
    tipsKey: 'guide.edit.tips',
  },
  {
    icon: CloudSun,
    titleKey: 'guide.weather.title',
    bodyKey: 'guide.weather.body',
    tipsKey: 'guide.weather.tips',
  },
  {
    icon: Bell,
    titleKey: 'guide.reminders.title',
    bodyKey: 'guide.reminders.body',
    tipsKey: 'guide.reminders.tips',
  },
  {
    icon: Share2,
    titleKey: 'guide.share.title',
    bodyKey: 'guide.share.body',
    tipsKey: 'guide.share.tips',
  },
  {
    icon: Download,
    titleKey: 'guide.export.title',
    bodyKey: 'guide.export.body',
    tipsKey: 'guide.export.tips',
  },
  {
    icon: Users,
    titleKey: 'guide.presence.title',
    bodyKey: 'guide.presence.body',
  },
  {
    icon: Languages,
    titleKey: 'guide.language.title',
    bodyKey: 'guide.language.body',
    cta: { labelKey: 'guide.language.cta', to: ROUTES.settings },
  },
  {
    icon: Smartphone,
    titleKey: 'guide.install.title',
    bodyKey: 'guide.install.body',
    cta: { labelKey: 'guide.install.cta', to: ROUTES.settings },
  },
  {
    icon: Shield,
    titleKey: 'guide.privacy.title',
    bodyKey: 'guide.privacy.body',
  },
]

function renderBulletList(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

export function GuidePage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">
          {t('guide.kicker')}
        </p>
        <h1 className="flex items-center gap-2.5">
          <BookOpen size={26} className="text-accent shrink-0" />
          {t('guide.heading')}
        </h1>
        <p className="text-text-secondary max-w-2xl leading-[22px]">{t('guide.lede')}</p>
      </header>

      <div className="flex flex-col gap-4">
        {SECTIONS.map((sec) => {
          const Icon = sec.icon
          const tipsRaw = sec.tipsKey ? t(sec.tipsKey) : ''
          const tips = tipsRaw ? renderBulletList(tipsRaw) : []
          return (
            <section
              key={sec.titleKey}
              className="rounded-xl border border-border-subtle bg-bg-surface p-4 lg:p-5 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="m-0 text-[16px] font-semibold">{t(sec.titleKey)}</h3>
                  <p className="text-[13px] text-text-secondary leading-[20px] mt-1 whitespace-pre-line">
                    {t(sec.bodyKey)}
                  </p>
                </div>
              </div>
              {tips.length > 0 && (
                <div className="flex flex-col gap-1.5 pl-[52px]">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.8px] text-text-tertiary">
                    <Lightbulb size={11} />
                    {t('guide.tips')}
                  </div>
                  <ul className="flex flex-col gap-1 text-[12px] text-text-secondary">
                    {tips.map((tip, i) => (
                      <li key={i} className="flex gap-2 leading-[18px]">
                        <span className="w-1 h-1 mt-2 rounded-full bg-accent shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sec.cta && (
                <div className="pl-[52px]">
                  <Link to={sec.cta.to}>
                    <Button variant="secondary" className="text-[12px]">
                      {t(sec.cta.labelKey)}
                    </Button>
                  </Link>
                </div>
              )}
            </section>
          )
        })}
      </div>

      <aside className="rounded-xl border border-border-subtle bg-bg-secondary p-4 text-[13px] text-text-secondary">
        <p className="font-semibold text-text-primary mb-1">{t('guide.stuckTitle')}</p>
        <p className="leading-[20px]">{t('guide.stuckBody')}</p>
      </aside>
    </div>
  )
}
