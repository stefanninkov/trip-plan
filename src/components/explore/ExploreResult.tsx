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
  ExternalLink,
  Tag,
  Timer,
} from 'lucide-react'
import type { DestinationOverview } from '@/types/explore'
import { googleMapsSearchUrl } from '@/utils/maps-link'
import { PlacePhoto } from '@/components/shared/PlacePhoto'

export function ExploreResult({ overview }: { overview: DestinationOverview }) {
  const subtitle = [overview.kind === 'country' ? null : overview.country, kindLabel(overview.kind)]
    .filter(Boolean)
    .join(' · ')

  const centerQuery =
    overview.centerQuery ||
    (overview.country && overview.country !== overview.name
      ? `${overview.name}, ${overview.country}`
      : overview.name)

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-2">
        <p className="text-[12px] uppercase tracking-[1.5px] text-text-tertiary">{subtitle}</p>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h1 className="text-[28px] md:text-[34px] leading-tight font-bold tracking-[-0.5px]">
            {overview.name}
          </h1>
          <MapLink query={centerQuery} label="Open in Google Maps" variant="solid" />
        </div>
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
        <p className="text-[14px] text-text-secondary leading-[22px] whitespace-pre-line">
          {overview.history}
        </p>
      </Section>

      <Section icon={<Landmark size={16} />} title="Must-see highlights">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {overview.highlights.map((h, i) => (
            <div
              key={i}
              className="rounded-lg border border-border-subtle bg-bg-secondary overflow-hidden flex flex-col"
            >
              <PlacePhoto
                query={`${h.name}, ${centerQuery}`}
                sig={`h-${i}`}
                aspectRatio="16 / 9"
                className="rounded-none border-0 border-b border-border-subtle"
              />
              <div className="p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[15px] font-semibold leading-tight">{h.name}</span>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-tertiary">
                  {h.category}
                </span>
              </div>
              <p className="text-[13px] text-text-secondary leading-[20px]">{h.why}</p>
              <MetaRow
                address={h.address}
                priceHint={h.priceHint}
                duration={h.duration}
              />
              <MapLink query={h.mapsQuery || `${h.name}, ${centerQuery}`} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {overview.neighborhoods.length > 0 && (
        <Section icon={<MapPin size={16} />} title="Areas worth knowing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overview.neighborhoods.map((n, i) => (
              <div
                key={i}
                className="rounded-lg border border-border-subtle bg-bg-secondary p-4 flex flex-col gap-2"
              >
                <span className="text-[15px] font-semibold">{n.name}</span>
                <p className="text-[13px] text-text-secondary leading-[20px]">{n.vibe}</p>
                <p className="text-[12px] text-text-tertiary">
                  <span className="text-text-secondary font-medium">Good for: </span>
                  {n.goodFor}
                </p>
                {n.anchors && n.anchors.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {n.anchors.map((a, j) => (
                      <span
                        key={j}
                        className="text-[11px] px-2 py-0.5 rounded-full border border-border-subtle bg-bg-elevated text-text-tertiary"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                <MapLink query={n.mapsQuery || `${n.name}, ${centerQuery}`} />
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section icon={<UtensilsCrossed size={16} />} title="What to eat">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {overview.food.map((f, i) => (
            <div
              key={i}
              className="rounded-lg border border-border-subtle bg-bg-secondary overflow-hidden flex flex-col"
            >
              <PlacePhoto
                query={`${f.name} food dish`}
                sig={`f-${i}`}
                aspectRatio="16 / 9"
                className="rounded-none border-0 border-b border-border-subtle"
              />
              <div className="p-4 flex flex-col gap-2">
                <span className="text-[15px] font-semibold">{f.name}</span>
                <p className="text-[13px] text-text-secondary leading-[20px]">{f.note}</p>
                <MetaRow address={f.address} priceHint={f.priceHint} />
                {(f.address || f.mapsQuery) && (
                  <MapLink query={f.mapsQuery || `${f.name}, ${centerQuery}`} />
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={<BedDouble size={16} />} title="Where to stay">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {overview.wheretoStay.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border border-border-subtle bg-bg-secondary p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[15px] font-semibold">{s.area}</span>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded bg-accent-muted text-accent">
                  {s.tier}
                </span>
              </div>
              <p className="text-[13px] text-text-secondary leading-[20px]">{s.why}</p>
              {s.examples && s.examples.length > 0 && (
                <ul className="flex flex-col gap-0.5 text-[12px] text-text-secondary">
                  {s.examples.map((ex, j) => (
                    <li key={j} className="pl-3 relative">
                      <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-accent" />
                      {ex}
                    </li>
                  ))}
                </ul>
              )}
              <MetaRow priceHint={s.priceHint} />
              <MapLink query={s.mapsQuery || `${s.area}, ${centerQuery}`} />
            </div>
          ))}
        </div>
      </Section>

      <Section icon={<Sparkles size={16} />} title="Things to do">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {overview.activities.map((a, i) => (
            <div
              key={i}
              className="rounded-lg border border-border-subtle bg-bg-secondary overflow-hidden flex flex-col"
            >
              <PlacePhoto
                query={`${a.name}, ${centerQuery}`}
                sig={`a-${i}`}
                aspectRatio="16 / 9"
                className="rounded-none border-0 border-b border-border-subtle"
              />
              <div className="p-4 flex flex-col gap-2">
                <span className="text-[15px] font-semibold">{a.name}</span>
                <p className="text-[13px] text-text-secondary leading-[20px]">{a.note}</p>
                <MetaRow address={a.address} priceHint={a.priceHint} duration={a.duration} />
                {(a.address || a.mapsQuery) && (
                  <MapLink query={a.mapsQuery || `${a.name}, ${centerQuery}`} />
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {(overview.tips.length > 0 || overview.watchouts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {overview.tips.length > 0 && (
            <Section icon={<Lightbulb size={16} />} title="Insider tips">
              <ul className="flex flex-col gap-1.5">
                {overview.tips.map((t, i) => (
                  <li
                    key={i}
                    className="text-[13px] text-text-secondary leading-[20px] pl-4 relative"
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
                    className="text-[13px] text-text-secondary leading-[20px] pl-4 relative"
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
      <span className="text-[13px] text-text-primary leading-[20px]">{value}</span>
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

function MetaRow({
  address,
  priceHint,
  duration,
}: {
  address?: string | null
  priceHint?: string | null
  duration?: string | null
}) {
  if (!address && !priceHint && !duration) return null
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-tertiary">
      {address && (
        <span className="inline-flex items-center gap-1">
          <MapPin size={11} />
          <span className="text-text-secondary">{address}</span>
        </span>
      )}
      {priceHint && (
        <span className="inline-flex items-center gap-1">
          <Tag size={11} />
          {priceHint}
        </span>
      )}
      {duration && (
        <span className="inline-flex items-center gap-1">
          <Timer size={11} />
          {duration}
        </span>
      )}
    </div>
  )
}

function MapLink({
  query,
  label = 'Open in Maps',
  variant = 'link',
}: {
  query: string
  label?: string
  variant?: 'link' | 'solid'
}) {
  if (!query) return null
  const href = googleMapsSearchUrl(query)
  if (variant === 'solid') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg border border-border-default bg-bg-secondary text-text-primary hover:border-border-strong hover:bg-bg-elevated transition-colors"
      >
        <MapPin size={12} />
        {label}
        <ExternalLink size={11} className="text-text-tertiary" />
      </a>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline self-start"
    >
      <ExternalLink size={11} />
      {label}
    </a>
  )
}

