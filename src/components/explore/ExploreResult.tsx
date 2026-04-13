import {
  Landmark,
  BookOpen,
  UtensilsCrossed,
  BedDouble,
  MapPin,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Clock,
  Calendar,
  Navigation,
} from 'lucide-react'
import type { DestinationOverview } from '@/types/explore'

export function ExploreResult({ overview }: { overview: DestinationOverview }) {
  const subtitle = [overview.kind === 'country' ? null : overview.country, kindLabel(overview.kind)]
    .filter(Boolean)
    .join(' \u00B7 ')

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-[12px] uppercase tracking-[1.5px] text-text-tertiary">{subtitle}</p>
        <h1 className="text-[28px] md:text-[34px] leading-tight font-bold tracking-[-0.5px]">
          {overview.name}
        </h1>
        <p className="text-text-secondary leading-[22px] max-w-3xl">{overview.summary}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <QuickFact icon={<Calendar size={14} />} label="Best time" value={overview.bestTimeToVisit} />
        <QuickFact icon={<Clock size={14} />} label="How long" value={overview.howManyDays} />
        <QuickFact
          icon={<Navigation size={14} />}
          label="Getting around"
          value={overview.gettingAround}
        />
      </div>

      <Section icon={<BookOpen size={16} />} title="History & context">
        <p className="text-[14px] text-text-secondary leading-[22px]">{overview.history}</p>
      </Section>

      <Section icon={<Landmark size={16} />} title="Must-see highlights">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {overview.highlights.map((h, i) => (
            <div
              key={i}
              className="rounded-lg border border-border-subtle bg-bg-secondary p-3 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold truncate">{h.name}</span>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-tertiary">
                  {h.category}
                </span>
              </div>
              <p className="text-[13px] text-text-secondary leading-[19px]">{h.why}</p>
            </div>
          ))}
        </div>
      </Section>

      {overview.neighborhoods.length > 0 && (
        <Section icon={<MapPin size={16} />} title="Areas worth knowing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {overview.neighborhoods.map((n, i) => (
              <div
                key={i}
                className="rounded-lg border border-border-subtle bg-bg-secondary p-3 flex flex-col gap-1"
              >
                <span className="text-[14px] font-semibold">{n.name}</span>
                <span className="text-[12px] text-text-tertiary">{n.vibe}</span>
                <span className="text-[12px] text-text-secondary">Good for: {n.goodFor}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section icon={<UtensilsCrossed size={16} />} title="What to eat">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {overview.food.map((f, i) => (
            <div
              key={i}
              className="rounded-lg border border-border-subtle bg-bg-secondary p-3 flex flex-col gap-0.5"
            >
              <span className="text-[14px] font-semibold">{f.name}</span>
              <p className="text-[12px] text-text-secondary leading-[18px]">{f.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={<BedDouble size={16} />} title="Where to stay">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {overview.wheretoStay.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border border-border-subtle bg-bg-secondary p-3 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold">{s.area}</span>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded bg-accent-muted text-accent">
                  {s.tier}
                </span>
              </div>
              <p className="text-[12px] text-text-secondary leading-[18px]">{s.why}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={<Sparkles size={16} />} title="Things to do">
        <ul className="flex flex-col gap-1.5">
          {overview.activities.map((a, i) => (
            <li
              key={i}
              className="rounded-lg border border-border-subtle bg-bg-secondary p-3 flex flex-col gap-0.5"
            >
              <span className="text-[14px] font-semibold">{a.name}</span>
              <p className="text-[12px] text-text-secondary leading-[18px]">{a.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      {(overview.tips.length > 0 || overview.watchouts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {overview.tips.length > 0 && (
            <Section icon={<Lightbulb size={16} />} title="Insider tips">
              <ul className="flex flex-col gap-1.5">
                {overview.tips.map((t, i) => (
                  <li
                    key={i}
                    className="text-[13px] text-text-secondary leading-[19px] pl-4 relative"
                  >
                    <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-accent" />
                    {t}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {overview.watchouts.length > 0 && (
            <Section icon={<AlertTriangle size={16} />} title="Watch out for">
              <ul className="flex flex-col gap-1.5">
                {overview.watchouts.map((w, i) => (
                  <li
                    key={i}
                    className="text-[13px] text-text-secondary leading-[19px] pl-4 relative"
                  >
                    <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-warning" />
                    {w}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function kindLabel(k: DestinationOverview['kind']): string {
  switch (k) {
    case 'country':
      return 'Country'
    case 'region':
      return 'Region'
    default:
      return 'City'
  }
}

function QuickFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-secondary p-3 flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[1px] text-text-tertiary">
        {icon}
        {label}
      </span>
      <span className="text-[13px] text-text-primary leading-[19px]">{value}</span>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="flex items-center gap-2 text-[16px] font-semibold">
        <span className="text-accent">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}
