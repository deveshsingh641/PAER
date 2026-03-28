import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL, apiFetch, type DocumentChecklistItem } from '../app/api'
import { Button, Card, InlineAlert, Stepper } from '../ui/ui'

const stepDefs = [
  { key: 'personal', title: 'Personal' },
  { key: 'identity', title: 'Identity' },
  { key: 'service', title: 'Service' },
  { key: 'documents', title: 'Documents' },
  { key: 'appointment', title: 'Appointment' },
] as const

async function uploadDocument(applicationId: string, requirementId: string, file: File) {
  const token = localStorage.getItem('paer_token')
  const form = new FormData()
  form.set('requirementId', requirementId)
  form.set('file', file)

  const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/documents`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })

  if (!res.ok) {
    let msg = 'Upload failed.'
    try {
      const data = (await res.json()) as { message?: string }
      msg = data.message || msg
    } catch {
      // ignore
    }
    throw new Error(msg)
  }
}

export function DocumentUploadPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [items, setItems] = useState<DocumentChecklistItem[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  async function refresh() {
    if (!id) return
    setBusy(true)
    setError(null)
    try {
      const res = await apiFetch<{ checklist: DocumentChecklistItem[] }>(
        `/applications/${id}/document-requirements`,
      )
      setItems(res.checklist)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load document checklist.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const allRequiredComplete = useMemo(() => {
    return items.filter((i) => i.required).every((i) => i.complete)
  }, [items])

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card title="Document upload (clear checklist)">
        <div className="space-y-4">
          <Stepper steps={stepDefs} current="documents" />

          <p className="text-sm text-slate-700">
            Upload each document once. If you’re unsure, use the hints — they show exactly what counts.
          </p>

          {error ? <InlineAlert tone="error" title="Could not load" description={error} /> : null}
          {uploadError ? <InlineAlert tone="error" title="Upload failed" description={uploadError} /> : null}
          {uploadSuccess ? <InlineAlert tone="success" title="Uploaded" description={uploadSuccess} /> : null}
          {busy ? <InlineAlert title="Loading" description="Fetching requirements…" /> : null}

          {!busy ? (
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {i.title}{' '}
                        {i.required ? (
                          <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                            Required
                          </span>
                        ) : (
                          <span className="ml-2 rounded-full border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-700">
                            Optional
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">{i.hint}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Status: {i.complete ? 'Uploaded' : 'Not uploaded'}
                        {i.uploadedCount ? ` • Files: ${i.uploadedCount}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <label
                          className={
                            'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 ' +
                            (uploadingId === i.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-50')
                          }
                        >
                          {uploadingId === i.id ? 'Uploading…' : 'Choose file'}
                        <input
                          type="file"
                          className="hidden"
                            disabled={uploadingId === i.id}
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            e.target.value = ''
                            if (!file || !id) return
                            setUploadError(null)
                            setUploadSuccess(null)
                            setUploadingId(i.id)
                            try {
                              await uploadDocument(id, i.id, file)
                              await refresh()
                              setUploadSuccess('Document uploaded successfully.')
                            } catch (err: unknown) {
                              setUploadError(err instanceof Error ? err.message : 'Upload failed.')
                            } finally {
                              setUploadingId(null)
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <InlineAlert
            tone={allRequiredComplete ? 'success' : 'warning'}
            title={allRequiredComplete ? 'All required documents uploaded' : 'Upload required documents to continue'}
            description={
              allRequiredComplete
                ? 'Next step: choose an appointment slot.'
                : 'You can still leave and come back — your uploaded files remain attached to this application.'
            }
          />

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={() => navigate(`/apply/${id}/form`)}>
              Back to form
            </Button>
            <Button disabled={!allRequiredComplete} onClick={() => navigate(`/apply/${id}/appointment`)}>
              Continue to appointment
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
