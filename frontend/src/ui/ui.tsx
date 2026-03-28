import { type ReactNode } from 'react'

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      {title ? (
        <header className="border-b border-slate-200 px-4 py-3 sm:px-6">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        </header>
      ) : null}
      <div className="px-4 py-4 sm:px-6">{children}</div>
    </section>
  )
}

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled,
  onClick,
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}) {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

  const styles =
    variant === 'primary'
      ? 'bg-slate-900 text-white hover:bg-slate-800'
      : variant === 'secondary'
        ? 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
        : 'text-slate-700 hover:bg-slate-100'

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  )
}

export function TextField({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-slate-900">{label}</label>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </div>
      {children}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 ' +
        (props.className || '')
      }
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 ' +
        (props.className || '')
      }
    />
  )
}

export function InlineAlert({
  title,
  description,
  tone = 'info',
}: {
  title: string
  description?: string
  tone?: 'info' | 'warning' | 'error' | 'success'
}) {
  const styles =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-900'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-slate-200 bg-slate-50 text-slate-900'

  return (
    <div className={`rounded-lg border px-4 py-3 ${styles}`}>
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="mt-1 text-sm opacity-90">{description}</p> : null}
    </div>
  )
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full bg-slate-900" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Stepper({
  steps,
  current,
}: {
  steps: ReadonlyArray<{ key: string; title: string }>
  current: string
}) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {steps.map((s, idx) => {
        const isActive = s.key === current
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={
                isActive
                  ? 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white'
                  : 'inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-700'
              }
            >
              {idx + 1}
            </span>
            <span className={isActive ? 'text-sm font-medium text-slate-900' : 'text-sm text-slate-600'}>
              {s.title}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function SyncBadge({
  state,
  lastSavedAt,
}: {
  state: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt?: string | null
}) {
  const text =
    state === 'saving'
      ? 'Saving…'
      : state === 'saved'
        ? lastSavedAt
          ? `Saved at ${formatTime(lastSavedAt)}`
          : 'Saved'
        : state === 'error'
          ? 'Could not save'
          : ' '

  const tone =
    state === 'error'
      ? 'text-red-700'
      : state === 'saving'
        ? 'text-slate-600'
        : 'text-slate-600'

  return <p className={`text-xs ${tone}`}>{text}</p>
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}
