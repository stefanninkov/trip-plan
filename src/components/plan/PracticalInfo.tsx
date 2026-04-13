import { CloudSun, FileCheck2, Smartphone, Luggage, CalendarCheck } from 'lucide-react'
import type { TripPlan } from '@/types/trip-plan'
import { Card } from '@/components/shared/Card'

export interface PracticalInfoProps {
  plan: TripPlan
}

interface Section {
  icon: typeof CloudSun
  title: string
  items?: string[]
  body?: string
}

export function PracticalInfo({ plan }: PracticalInfoProps) {
  const sections: Section[] = [
    { icon: CloudSun, title: 'Weather', body: plan.weatherNote },
    { icon: CalendarCheck, title: 'Book ahead', items: plan.bookAhead },
    { icon: Luggage, title: 'Packing tips', items: plan.packingTips },
    { icon: FileCheck2, title: 'Documents', items: plan.documentsNeeded },
    { icon: Smartphone, title: 'Apps to download', items: plan.appsToDownload },
  ]
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {sections.map(({ icon: Icon, title, items, body }) =>
        body || (items && items.length > 0) ? (
          <Card key={title} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-text-secondary">
              <Icon size={15} className="text-accent" />
              <span className="text-[12px] font-semibold uppercase tracking-[1.5px]">
                {title}
              </span>
            </div>
            {body && <p className="text-[13px] text-text-primary">{body}</p>}
            {items && (
              <ul className="flex flex-col gap-1 text-[13px] text-text-primary">
                {items.map((it, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-text-tertiary">·</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null
      )}
    </section>
  )
}
