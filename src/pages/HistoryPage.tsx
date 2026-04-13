import { Card } from '@/components/shared/Card'

export function HistoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">History</p>
        <h1>Your trips</h1>
      </div>
      <Card>
        <p className="text-text-secondary">
          Saved trips will appear here once trip generation and Firestore persistence are wired up
          in Phase C and Phase F.
        </p>
      </Card>
    </div>
  )
}
