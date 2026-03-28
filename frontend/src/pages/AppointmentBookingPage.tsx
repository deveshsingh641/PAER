import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch, type Slot } from '../app/api'
import { useAuth } from '../app/auth/useAuth'
import { Button, Card, InlineAlert, Input, Stepper, TextField } from '../ui/ui'

const stepDefs = [
  { key: 'personal', title: 'Personal' },
  { key: 'identity', title: 'Identity' },
  { key: 'service', title: 'Service' },
  { key: 'documents', title: 'Documents' },
  { key: 'appointment', title: 'Appointment' },
] as const

export function AppointmentBookingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useAuth()

  const [city, setCity] = useState(state.status === 'authed' ? state.user.city || 'City' : 'City')
  const [slots, setSlots] = useState<Slot[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<string | null>(null)
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  async function loadSlots() {
    setBusy(true)
    setError(null)
    try {
      const res = await apiFetch<{ slots: Slot[] }>(`/appointments/slots?city=${encodeURIComponent(city)}`)
      setSlots(res.slots)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load slots.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void loadSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const s of slots) {
      const key = s.centerName
      const arr = map.get(key) || []
      arr.push(s)
      map.set(key, arr)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.slotStart.localeCompare(b.slotStart))
    }
    return Array.from(map.entries())
  }, [slots])

  const selectedSlot = useMemo(() => {
    return slots.find((s) => s.slotId === selected) || null
  }, [selected, slots])

  async function onBook() {
    if (!id || !selectedSlot) return
    setBooking(true)
    setBookingError(null)
    try {
      await apiFetch(`/applications/${id}/appointment`, {
        method: 'POST',
        body: JSON.stringify({ slot: selectedSlot }),
      })
      navigate(`/apply/${id}/confirmation`)
    } catch (e: unknown) {
      setBookingError(e instanceof Error ? e.message : 'Could not book appointment.')
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Card title="Book an appointment (simple, calm)">
        <div className="space-y-4">
          <Stepper steps={stepDefs} current="appointment" />

          <p className="text-sm text-slate-700">
            Choose a slot that is available. If you don’t see a good time, change the city and reload.
          </p>

          {error ? <InlineAlert tone="error" title="Could not load slots" description={error} /> : null}
          {bookingError ? <InlineAlert tone="error" title="Could not book" description={bookingError} /> : null}

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full max-w-sm">
              <TextField label="City">
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </TextField>
            </div>
            <Button variant="secondary" onClick={() => void loadSlots()} disabled={busy}>
              {busy ? 'Loading…' : 'Reload slots'}
            </Button>
          </div>

          {busy ? <InlineAlert title="Loading" description="Fetching available time slots…" /> : null}

          {!busy ? (
            <div className="space-y-4">
              {grouped.map(([centerName, centerSlots]) => (
                <div key={centerName} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">{centerName}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {centerSlots.map((s) => {
                      const disabled = !s.available
                      const checked = selected === s.slotId
                      return (
                        <label
                          key={s.slotId}
                          className={
                            'flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ' +
                            (disabled
                              ? 'border-slate-200 bg-slate-50 text-slate-400'
                              : checked
                                ? 'border-slate-900 bg-slate-50 text-slate-900'
                                : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50')
                          }
                        >
                          <span>{new Date(s.slotStart).toLocaleString()}</span>
                          <span className={disabled ? 'text-xs' : 'text-xs font-medium'}>
                            {disabled ? 'Full' : 'Available'}
                          </span>
                          <input
                            type="radio"
                            name="slot"
                            value={s.slotId}
                            className="hidden"
                            disabled={disabled}
                            checked={checked}
                            onChange={() => setSelected(s.slotId)}
                          />
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}

              {slots.length === 0 ? (
                <InlineAlert
                  tone="warning"
                  title="No slots found"
                  description="Try a different city or reload."
                />
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={() => navigate(`/apply/${id}/documents`)}>
              Back to documents
            </Button>
            <Button disabled={!selectedSlot || booking} onClick={() => void onBook()}>
              {booking ? 'Booking…' : 'Confirm appointment'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
