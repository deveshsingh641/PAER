import { Link } from 'react-router-dom'
import { Card } from '../ui/ui'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Card title="Page not found">
        <p className="text-sm text-slate-700">The page you’re looking for doesn’t exist.</p>
        <Link to="/" className="mt-3 inline-block text-sm font-medium text-slate-900 underline">
          Go to home
        </Link>
      </Card>
    </div>
  )
}
