import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../app/auth/useAuth'
import { Button, Card } from '../ui/ui'

export function HomePage() {
  const { state } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Passport application, redesigned for clarity</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
          Step-by-step guidance, clear document requirements, and a calmer booking experience. Drafts save automatically so
          you can pause anytime.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {state.status === 'authed' ? (
            <>
              <Button onClick={() => navigate('/start')}>Start new application</Button>
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                Go to dashboard
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button>Log in to start</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary">Try OTP login (demo)</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card title="What you’ll do">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Fill your details in 3 short steps</li>
            <li>Upload documents with a clear checklist</li>
            <li>Book an appointment with available slots only</li>
          </ul>
        </Card>
        <Card title="Why this feels easier">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Progress indicator across the journey</li>
            <li>Plain-language errors with exact fixes</li>
            <li>Autosave with “Saved at” feedback</li>
          </ul>
        </Card>
        <Card title="After submission">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Download your application PDF</li>
            <li>Download appointment receipt</li>
            <li>Copy/share your application ID</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
