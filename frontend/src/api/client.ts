import { clearSession, readSession } from '../auth/session'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function baseUrl() {
  const configured = import.meta.env.VITE_API_URL
  if (!configured) return ''
  return configured.replace(/\/$/, '')
}

function unauthorized(): never {
  clearSession()
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login')
  }
  throw new ApiError(401, 'Your session has ended.')
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const session = readSession()
  const headers = new Headers(init?.headers)
  if (session) headers.set('Authorization', `Bearer ${session.token}`)
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${baseUrl()}${path}`, { ...init, headers })
  if (response.status === 401) unauthorized()
  if (!response.ok) throw new ApiError(response.status, await readError(response))
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function readError(response: Response) {
  const text = await response.text()
  if (!text) return `The request failed (${response.status}).`
  try {
    const body = JSON.parse(text) as { error?: string; message?: string; detail?: string }
    return body.error || body.message || body.detail || text
  } catch {
    return text
  }
}

export function apiGet<T>(path: string) {
  return request<T>(path)
}

export function apiPost<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) })
}
