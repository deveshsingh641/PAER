import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { apiFetch, type Application } from '../app/api'
import { Button, Card, InlineAlert, Input, Select, Stepper, SyncBadge, TextField } from '../ui/ui'

type FormValues = {
  fullName: string
  dob: string
  gender: string
  addressLine1: string
  addressLine2: string
  pincode: string
  idType: string
  idNumber: string
  passportType: string
  bookletPages: string
  deliveryMode: string
}

const stepDefs = [
  { key: 'personal', title: 'Personal' },
  { key: 'identity', title: 'Identity' },
  { key: 'service', title: 'Service' },
  { key: 'documents', title: 'Documents' },
  { key: 'appointment', title: 'Appointment' },
] as const

type StepKey = (typeof stepDefs)[number]['key']

type FormStep = Exclude<StepKey, 'documents' | 'appointment'>

function isBlank(v?: string) {
  return !v || !String(v).trim()
}

export function ApplicationFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [app, setApp] = useState<Application | null>(null)
  const [busy, setBusy] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  const [step, setStep] = useState<FormStep>('personal')
  const saveTimer = useRef<number | null>(null)

  const form = useForm<FormValues>({
    defaultValues: {
      fullName: '',
      dob: '',
      gender: '',
      addressLine1: '',
      addressLine2: '',
      pincode: '',
      idType: '',
      idNumber: '',
      passportType: '',
      bookletPages: '',
      deliveryMode: '',
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) return
      setBusy(true)
      setLoadError(null)
      try {
        const res = await apiFetch<{ application: Application }>(`/applications/${id}`)
        if (cancelled) return
        setApp(res.application)

        const p = res.application.form?.personal || {}
        const i = res.application.form?.identity || {}
        const s = res.application.form?.service || {}

        form.reset({
          fullName: p.fullName || '',
          dob: p.dob || '',
          gender: (p.gender as string) || '',
          addressLine1: p.addressLine1 || '',
          addressLine2: p.addressLine2 || '',
          pincode: p.pincode || '',
          idType: i.idType || '',
          idNumber: i.idNumber || '',
          passportType: s.passportType || '',
          bookletPages: s.bookletPages || '',
          deliveryMode: s.deliveryMode || '',
        })

        // Choose the first incomplete step (reduces "where do I start" confusion)
        if (isBlank(p.fullName) || isBlank(p.dob) || isBlank(p.addressLine1) || isBlank(p.pincode)) setStep('personal')
        else if (isBlank(i.idType) || isBlank(i.idNumber)) setStep('identity')
        else setStep('service')

        setLastSavedAt(res.application.updatedAt)
        setSyncState('saved')
      } catch (e: unknown) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Could not load application.')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const watched = useWatch({ control: form.control })

  const patchPayload = useMemo(() => {
    return {
      form: {
        personal: {
          fullName: watched.fullName,
          dob: watched.dob,
          gender: watched.gender || undefined,
          addressLine1: watched.addressLine1,
          addressLine2: watched.addressLine2 || undefined,
          pincode: watched.pincode,
        },
        identity: {
          idType: watched.idType || undefined,
          idNumber: watched.idNumber,
        },
        service: {
          passportType: watched.passportType || undefined,
          bookletPages: watched.bookletPages || undefined,
          deliveryMode: watched.deliveryMode || undefined,
        },
      },
    }
  }, [
    watched.addressLine1,
    watched.addressLine2,
    watched.bookletPages,
    watched.deliveryMode,
    watched.dob,
    watched.fullName,
    watched.gender,
    watched.idNumber,
    watched.idType,
    watched.passportType,
    watched.pincode,
  ])

  useEffect(() => {
    if (!id || busy) return
    if (!form.formState.isDirty) return

    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    setSyncState('saving')

    saveTimer.current = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await apiFetch<{ savedAt: string }>(`/applications/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(patchPayload),
          })
          setLastSavedAt(res.savedAt)
          setSyncState('saved')
        } catch {
          setSyncState('error')
        }
      })()
    }, 800)

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [busy, form.formState.isDirty, id, patchPayload])

  async function onNext() {
    if (step === 'personal') {
      const ok = await form.trigger(['fullName', 'dob', 'addressLine1', 'pincode'])
      if (!ok) return
      setStep('identity')
      return
    }
    if (step === 'identity') {
      const ok = await form.trigger(['idType', 'idNumber'])
      if (!ok) return
      setStep('service')
      return
    }

    const ok = await form.trigger(['passportType', 'bookletPages', 'deliveryMode'])
    if (!ok) return
    navigate(`/apply/${id}/documents`)
  }

  function onBack() {
    if (step === 'identity') setStep('personal')
    else if (step === 'service') setStep('identity')
    else navigate('/dashboard')
  }

  const currentKey: StepKey = step

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card title="Application form (step-by-step)">
        <div className="space-y-4">
          <Stepper steps={stepDefs} current={currentKey} />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-700">
              Short steps, clear questions. You can leave anytime — progress saves automatically.
            </p>
            <SyncBadge state={syncState} lastSavedAt={lastSavedAt} />
          </div>

          {loadError ? <InlineAlert tone="error" title="Could not load" description={loadError} /> : null}
          {busy ? <InlineAlert title="Loading" description="Fetching your saved draft…" /> : null}

          {!busy && app ? (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {step === 'personal' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Full name" error={form.formState.errors.fullName?.message}>
                    <Input
                      {...form.register('fullName', { required: 'Enter your full name.' })}
                      autoComplete="name"
                    />
                  </TextField>

                  <TextField label="Date of birth" error={form.formState.errors.dob?.message}>
                    <Input {...form.register('dob', { required: 'Select your date of birth.' })} type="date" />
                  </TextField>

                  <TextField label="Gender" hint="Optional">
                    <Select {...form.register('gender')}>
                      <option value="">Prefer not to say</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </Select>
                  </TextField>

                  <div />

                  <TextField label="Address line 1" error={form.formState.errors.addressLine1?.message}>
                    <Input {...form.register('addressLine1', { required: 'Enter your address.' })} />
                  </TextField>

                  <TextField label="Address line 2" hint="Optional">
                    <Input {...form.register('addressLine2')} />
                  </TextField>

                  <TextField label="Pincode" error={form.formState.errors.pincode?.message}>
                    <Input
                      {...form.register('pincode', {
                        required: 'Enter your pincode.',
                        minLength: { value: 4, message: 'Pincode looks too short.' },
                      })}
                      inputMode="numeric"
                      autoComplete="postal-code"
                    />
                  </TextField>
                </div>
              ) : null}

              {step === 'identity' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="ID type" error={form.formState.errors.idType?.message}>
                    <Select {...form.register('idType', { required: 'Select an ID type.' })}>
                      <option value="">Select</option>
                      <option value="National ID">National ID</option>
                      <option value="Driver License">Driver License</option>
                      <option value="Student ID">Student ID</option>
                      <option value="Other">Other</option>
                    </Select>
                  </TextField>

                  <TextField label="ID number" error={form.formState.errors.idNumber?.message}>
                    <Input
                      {...form.register('idNumber', {
                        required: 'Enter the ID number.',
                        minLength: { value: 3, message: 'ID number looks too short.' },
                      })}
                      autoComplete="off"
                    />
                  </TextField>

                  <InlineAlert
                    tone="info"
                    title="Why we ask"
                    description="This helps verify identity during the appointment. You can upload the matching document in the next step."
                  />
                </div>
              ) : null}

              {step === 'service' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Passport type" error={form.formState.errors.passportType?.message}>
                    <Select {...form.register('passportType', { required: 'Select the passport type.' })}>
                      <option value="">Select</option>
                      <option value="New Passport">New Passport</option>
                      <option value="Re-issue / Renewal">Re-issue / Renewal</option>
                    </Select>
                  </TextField>

                  <TextField label="Booklet pages" error={form.formState.errors.bookletPages?.message}>
                    <Select {...form.register('bookletPages', { required: 'Select booklet pages.' })}>
                      <option value="">Select</option>
                      <option value="36">36 pages</option>
                      <option value="60">60 pages</option>
                    </Select>
                  </TextField>

                  <TextField label="Delivery mode" error={form.formState.errors.deliveryMode?.message}>
                    <Select {...form.register('deliveryMode', { required: 'Select delivery mode.' })}>
                      <option value="">Select</option>
                      <option value="Standard">Standard</option>
                      <option value="Tatkal">Tatkal</option>
                    </Select>
                  </TextField>

                  <InlineAlert
                    tone="info"
                    title="Draft saves automatically"
                    description="You’ll see a “Saved at …” indicator so you know your progress is safe."
                  />
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <Button variant="secondary" onClick={onBack}>
                  Back
                </Button>
                <Button onClick={() => void onNext()}>
                  {step === 'service' ? 'Continue to documents' : 'Next'}
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
