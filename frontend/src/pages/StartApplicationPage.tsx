import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../app/api'
import { useAuth } from '../app/auth/useAuth'
import { Button, Card, InlineAlert, Input, TextField } from '../ui/ui'

export function StartApplicationPage() {
  const { state } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [city, setCity] = useState(state.status === 'authed' ? state.user.city || '' : '')

  async function onStart() {
    setError(null)
    setBusy(true)
    try {
      const res = await apiFetch<{ applicationId: string }>('/applications', {
        method: 'POST',
        body: JSON.stringify({ city: city || undefined }),
      })
      navigate(`/apply/${res.applicationId}/form`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not start an application.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card title="Before you start">
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            You’ll complete the journey in small steps. If you stop midway, your progress stays saved.
          </p>

          {error ? <InlineAlert tone="error" title="Could not start" description={error} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <InlineAlert
              title="Time needed"
              description="15–25 minutes for the form + uploads, then book a 5-minute appointment slot."
            />
            <InlineAlert
              title="Documents you’ll upload"
              description="Photo, identity proof, address proof, and date-of-birth proof. You’ll see a checklist with examples."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="City for appointment search" hint="Used only to show nearby centers">
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </TextField>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-900">Steps</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                <li>Fill form (3 short steps)</li>
                <li>Upload documents (checklist)</li>
                <li>Book appointment</li>
                <li>Review & submit</li>
              </ol>
            </div>
          </div>

          <div className="flex justify-end">
            <Button disabled={busy || !city} onClick={onStart}>
              {busy ? 'Starting…' : 'Start new application'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
