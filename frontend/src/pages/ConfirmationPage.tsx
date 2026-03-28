import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL, apiFetch, type Application, type DocumentChecklistItem } from '../app/api'
import { Button, Card, InlineAlert, ProgressBar } from '../ui/ui'

function extractMissing(err: unknown): string[] | null {
  if (!err || typeof err !== 'object') return null
  const data = (err as { data?: unknown }).data
  if (!data || typeof data !== 'object') return null
  const missing = (data as { missing?: unknown }).missing
  if (!Array.isArray(missing)) return null
  const filtered = missing.filter((m): m is string => typeof m === 'string')
  return filtered.length ? filtered : null
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

export function ConfirmationPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [app, setApp] = useState<Application | null>(null)
  const [checklist, setChecklist] = useState<DocumentChecklistItem[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [missing, setMissing] = useState<string[] | null>(null)

  async function load() {
    if (!id) return
    setBusy(true)
    setError(null)
    try {
      const res = await apiFetch<{ application: Application }>(`/applications/${id}`)
      const docs = await apiFetch<{ checklist: DocumentChecklistItem[] }>(
        `/applications/${id}/document-requirements`,
      )
      setApp(res.application)
      setChecklist(docs.checklist)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load confirmation.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const requiredDocsMissing = useMemo(() => {
    return checklist.filter((c) => c.required && !c.complete).map((c) => c.title)
  }, [checklist])

  const percent = useMemo(() => {
    const completed = app?.progress?.completedSteps ?? 0
    return Math.round((completed / 5) * 100)
  }, [app])

  async function onSubmit() {
    if (!id) return
    setSubmitting(true)
    setSubmitError(null)
    setMissing(null)
    try {
      await apiFetch(`/applications/${id}/submit`, { method: 'POST' })
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not submit.'
      setSubmitError(msg)
      const m = extractMissing(e)
      if (m) setMissing(m)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card title="Review & confirmation">
        <div className="space-y-4">
          {error ? <InlineAlert tone="error" title="Could not load" description={error} /> : null}
          {busy ? <InlineAlert title="Loading" description="Fetching your saved application…" /> : null}

          {!busy && app ? (
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">Application ID</p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-slate-700">{app.id}</p>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      await navigator.clipboard.writeText(app.id)
                    }}
                  >
                    Copy ID
                  </Button>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600">Progress</p>
                    <p className="text-xs font-medium text-slate-900">{percent}%</p>
                  </div>
                  <ProgressBar value={percent} />
                </div>
              </div>

              {app.status === 'Submitted' ? (
                <InlineAlert
                  tone="success"
                  title="Application submitted"
                  description="You can download your PDF and appointment receipt anytime from the dashboard."
                />
              ) : (
                <InlineAlert
                  tone="info"
                  title="Almost done"
                  description="Confirm your appointment and required uploads, then submit." 
                />
              )}

              {submitError ? (
                <InlineAlert
                  tone="error"
                  title="Could not submit"
                  description={missing?.length ? `Missing: ${missing.join(', ')}` : submitError}
                />
              ) : null}

              {requiredDocsMissing.length ? (
                <InlineAlert
                  tone="warning"
                  title="Required documents missing"
                  description={requiredDocsMissing.join(' • ')}
                />
              ) : null}

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Summary</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-600">Name</p>
                      <p className="text-sm text-slate-900">{app.form?.personal?.fullName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">DOB</p>
                      <p className="text-sm text-slate-900">{app.form?.personal?.dob || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">ID</p>
                      <p className="text-sm text-slate-900">
                        {(app.form?.identity?.idType || '-') + ' • ' + (app.form?.identity?.idNumber || '-')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Service</p>
                      <p className="text-sm text-slate-900">
                        {(app.form?.service?.passportType || '-') +
                          ' • ' +
                          (app.form?.service?.bookletPages || '-') +
                          ' pages • ' +
                          (app.form?.service?.deliveryMode || '-')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Appointment</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {app.appointment?.slotStart
                      ? `${app.appointment.centerName} • ${new Date(app.appointment.slotStart).toLocaleString()}`
                      : 'Not booked yet'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                  Back to dashboard
                </Button>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      downloadWithAuth(
                        `${API_BASE_URL}/applications/${app.id}/export/pdf`,
                        `application-${app.id}.pdf`,
                      )
                    }
                  >
                    Download application PDF
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      downloadWithAuth(
                        `${API_BASE_URL}/applications/${app.id}/export/receipt`,
                        `appointment-receipt-${app.id}.pdf`,
                      )
                    }
                  >
                    Download receipt
                  </Button>

                  {app.status !== 'Submitted' ? (
                    <Button disabled={submitting} onClick={() => void onSubmit()}>
                      {submitting ? 'Submitting…' : 'Submit application'}
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
