import { useParams } from 'react-router-dom'
import { Card } from '@/components/shared/Card'

export function SharedTripPage() {
  const { shareToken } = useParams<{ shareToken: string }>()
  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <Card className="max-w-lg">
        <h1 className="mb-2">Shared trip</h1>
        <p className="text-text-secondary">
          Public read-only view for trip token <code>{shareToken}</code> will render here (Phase G).
        </p>
      </Card>
    </div>
  )
}
