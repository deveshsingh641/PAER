export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export type ApiError = {
  error: string
  message?: string
  missing?: string[]
  issues?: Array<{ path: (string | number)[]; message: string }>
}

function getToken(): string | null {
  return localStorage.getItem('paer_token')
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem('paer_token')
  else localStorage.setItem('paer_token', token)
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.auth !== false) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (res.ok) {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) return (await res.json()) as T
    return (await res.text()) as unknown as T
  }

  let err: ApiError = { error: 'UNKNOWN_ERROR', message: 'Something went wrong.' }
  try {
    err = (await res.json()) as ApiError
  } catch {
    // ignore
  }

  throw Object.assign(new Error(err.message || 'Request failed'), { status: res.status, data: err })
}

export type UserSafe = {
  id: string
  email: string | null
  phone: string | null
  name: string | null
  dob: string | null
  city: string | null
}

export type Application = {
  id: string
  status: 'Draft' | 'Submitted'
  onboarding?: { city?: string | null }
  form?: {
    personal?: {
      fullName?: string
      dob?: string
      gender?: string
      addressLine1?: string
      addressLine2?: string
      pincode?: string
    }
    identity?: { idType?: string; idNumber?: string }
    service?: { passportType?: string; bookletPages?: string; deliveryMode?: string }
  }
  documents?: Array<{ id: string; requirementId: string; originalName: string; uploadedAt: string }>
  appointment?: {
    slotId: string
    city: string
    centerId: string
    centerName: string
    slotStart: string
    bookedAt: string
  } | null
  progress?: { completedSteps: number }
  createdAt: string
  updatedAt: string
  submittedAt?: string
}

export type ApplicationSummary = {
  id: string
  status: 'Draft' | 'Submitted'
  completedSteps: number
  totalSteps: number
  percent: number
  updatedAt: string
  submittedAt: string | null
  appointment: Application['appointment']
}

export type DocumentChecklistItem = {
  id: string
  title: string
  required: boolean
  hint: string
  uploadedCount: number
  complete: boolean
}

export type Slot = {
  slotId: string
  city: string
  centerId: string
  centerName: string
  slotStart: string
  available: boolean
}
