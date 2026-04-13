import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/shared/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="text-center flex flex-col gap-4 items-center">
        <h1>404</h1>
        <p className="text-text-secondary">This page does not exist.</p>
        <Link to={ROUTES.home}>
          <Button variant="secondary">Go home</Button>
        </Link>
      </div>
    </div>
  )
}
