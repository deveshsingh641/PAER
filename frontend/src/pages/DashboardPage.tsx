import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL, apiFetch, type ApplicationSummary } from '../app/api'
import { Button, Card, InlineAlert, ProgressBar } from '../ui/ui'

function nextRouteFor(app: ApplicationSummary) {
  if (app.status === 'Submitted') return `/apply/${app.id}/confirmation`
  if (app.completedSteps < 3) return `/apply/${app.id}/form`
  if (app.completedSteps === 3) return `/apply/${app.id}/documents`
  if (app.completedSteps === 4) return `/apply/${app.id}/appointment`
  return `/apply/${app.id}/confirmation`
}

async function downloadWithAuth(url: string, filename: string) {
  const token = localStorage.getItem('paer_token')
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!res.ok) throw new Error('Download failed.')
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [apps, setApps] = useState<ApplicationSummary[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const hasApps = apps.length > 0

  useEffect(() => {
    let cancelled = false
    async function load() {
      setBusy(true)
      setError(null)
      try {
        const res = await apiFetch<{ applications: ApplicationSummary[] }>('/applications')
        if (!cancelled) setApps(res.applications)
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load dashboard.')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const header = useMemo(() => {
    if (busy) return 'Your applications'
    return hasApps ? 'Your applications' : 'No applications yet'
  }, [busy, hasApps])

  return (
    <div className="space-y-4">
      <Card title={header}>
        <div className="space-y-4">
          {error ? <InlineAlert tone="error" title="Could not load" description={error} /> : null}

          {!busy && !hasApps ? (
            <InlineAlert
              tone="info"
              title="Start your first application"
              description="You can stop anytime — drafts autosave and remain accessible here."
            />
          ) : null}

          <div className="flex justify-end">
            <Button onClick={() => navigate('/start')}>Start new application</Button>
          </div>

          <div className="grid gap-4">
            {apps.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Application {a.id}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Status: {a.status} • Last updated: {new Date(a.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => navigate(nextRouteFor(a))}>
                      {a.status === 'Submitted' ? 'View' : 'Continue'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => downloadWithAuth(`${API_BASE_URL}/applications/${a.id}/export/pdf`, `application-${a.id}.pdf`)}
                    >
                      Download PDF
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        downloadWithAuth(
                          `${API_BASE_URL}/applications/${a.id}/export/receipt`,
                          `appointment-receipt-${a.id}.pdf`,
                        )
                      }
                    >
                      Receipt
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600">Progress</p>
                    <p className="text-xs font-medium text-slate-900">{a.percent}%</p>
                  </div>
                  <ProgressBar value={a.percent} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
