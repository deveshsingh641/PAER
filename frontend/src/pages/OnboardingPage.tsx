import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../app/api'
import { useAuth } from '../app/auth/useAuth'
import { Button, Card, InlineAlert, Input, TextField } from '../ui/ui'

export function OnboardingPage() {
  const { state, refreshMe } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [city, setCity] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (state.status === 'authed') {
      setName(state.user.name || '')
      setDob(state.user.dob || '')
      setCity(state.user.city || '')
    }
  }, [state])

  async function onSave() {
    setError(null)
    setBusy(true)
    try {
      await apiFetch('/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, dob, city }),
      })
      await refreshMe()
      navigate('/start')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save your setup.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card title="Welcome — quick setup (1 minute)">
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            This reduces anxiety later: we’ll pre-fill what we can and show appointment centers near your city.
          </p>

          {error ? <InlineAlert tone="error" title="Could not save" description={error} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Full name">
              <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </TextField>
            <TextField label="Date of birth">
              <Input value={dob} onChange={(e) => setDob(e.target.value)} type="date" />
            </TextField>
          </div>

          <TextField label="City">
            <Input value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
          </TextField>

          <InlineAlert
            tone="info"
            title="What’s next"
            description="You’ll see the full journey (steps, time, documents) before starting. Your application will autosave as you go."
          />

          <div className="flex justify-end">
            <Button disabled={busy || !name || !dob || !city} onClick={onSave}>
              {busy ? 'Saving…' : 'Continue'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
