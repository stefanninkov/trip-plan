import { Card } from '@/components/shared/Card'

export function NewTripPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">Phase B coming</p>
        <h1>New trip wizard</h1>
      </div>
      <Card>
        <p className="text-text-secondary">
          The step-by-step trip wizard (origin, destinations, dates, travelers + progressive
          disclosure of advanced options) will be built in Phase B.
        </p>
      </Card>
    </div>
  )
}
