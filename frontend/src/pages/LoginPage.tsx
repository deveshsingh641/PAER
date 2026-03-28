import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiFetch, type UserSafe } from '../app/api'
import { useAuth } from '../app/auth/useAuth'
import { Button, Card, InlineAlert, Input, TextField } from '../ui/ui'

type LocationState = { from?: string }

export function LoginPage() {
  const { state, loginWithToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from || '/dashboard'

  const [mode, setMode] = useState<'password' | 'otp'>('password')

  // Email/password
  const [email, setEmail] = useState('hire-me@anshumat.org')
  const [password, setPassword] = useState('HireMe@2025!')

  // OTP
  const [phone, setPhone] = useState('9999999999')
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [name, setName] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (state.status === 'authed') {
      const u = state.user
      const needsOnboarding = !(u.name && u.dob && u.city)
      navigate(needsOnboarding ? '/onboarding' : from, { replace: true })
    }
  }, [from, navigate, state])

  const header = useMemo(() => {
    return mode === 'password' ? 'Log in (demo reviewer)' : 'Log in with OTP (demo)'
  }, [mode])

  async function onLoginPassword() {
    setError(null)
    setBusy(true)
    try {
      const res = await apiFetch<{ token: string; user: Pick<UserSafe, 'id' | 'email' | 'name'> }>(
        '/auth/login',
        {
          method: 'POST',
          auth: false,
          body: JSON.stringify({ email, password }),
        },
      )

      await loginWithToken(res.token)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not log in.')
    } finally {
      setBusy(false)
    }
  }

  async function onRequestOtp() {
    setError(null)
    setBusy(true)
    try {
      const res = await apiFetch<{ challengeId: string; devOtp: string }>('/auth/request-otp', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ phone }),
      })
      setChallengeId(res.challengeId)
      setDevOtp(res.devOtp)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not request OTP.')
    } finally {
      setBusy(false)
    }
  }

  async function onVerifyOtp() {
    if (!challengeId) return
    setError(null)
    setBusy(true)
    try {
      const res = await apiFetch<{ token: string; user: UserSafe }>('/auth/verify-otp', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ challengeId, otp, name: name || undefined }),
      })
      await loginWithToken(res.token)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not verify OTP.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card title={header}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === 'password' ? 'primary' : 'secondary'} onClick={() => setMode('password')}>
              Email + password
            </Button>
            <Button variant={mode === 'otp' ? 'primary' : 'secondary'} onClick={() => setMode('otp')}>
              Mobile OTP
            </Button>
          </div>

          {error ? <InlineAlert tone="error" title="Could not log in" description={error} /> : null}

          {mode === 'password' ? (
            <div className="space-y-4">
              <InlineAlert
                tone="info"
                title="Demo login (required by submission)"
                description="Email: hire-me@anshumat.org • Password: HireMe@2025!"
              />

              <TextField label="Email">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </TextField>
              <TextField label="Password">
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                />
              </TextField>

              <div className="flex justify-end">
                <Button disabled={busy} onClick={onLoginPassword}>
                  {busy ? 'Logging in…' : 'Log in'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <InlineAlert
                tone="warning"
                title="OTP is simulated"
                description="For this assignment demo, the server returns a developer OTP so reviewers can test the flow without SMS."
              />

              <TextField label="Mobile number" hint="No country code needed for demo">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" />
              </TextField>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" disabled={busy} onClick={onRequestOtp}>
                  {busy ? 'Sending…' : 'Send OTP'}
                </Button>
              </div>

              {challengeId ? (
                <div className="space-y-4">
                  {devOtp ? (
                    <InlineAlert tone="info" title="Demo OTP" description={`Use ${devOtp} to continue.`} />
                  ) : null}

                  <TextField label="Your name (optional)" hint="Used on receipts">
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </TextField>

                  <TextField label="Enter OTP">
                    <Input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" />
                  </TextField>

                  <div className="flex justify-end">
                    <Button disabled={busy || otp.length < 4} onClick={onVerifyOtp}>
                      {busy ? 'Verifying…' : 'Verify & log in'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
