import { parseApiError } from './errors'

const API = import.meta.env.VITE_API_URL as string

let csrfTokenPromise: Promise<string> | null = null

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch(`${API}/auth/csrf`, { credentials: 'include' })
  if (!res.ok) {
    throw new Error('Failed to fetch CSRF token')
  }
  const data = (await res.json()) as { csrfToken: string }
  return data.csrfToken
}

async function getCsrfToken(): Promise<string> {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetchCsrfToken().finally(() => {
      csrfTokenPromise = null
    })
  }
  return csrfTokenPromise
}

export function invalidateCsrfToken(): void {
  csrfTokenPromise = null
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)

  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    headers.set('X-CSRFToken', await getCsrfToken())
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${API}${path}`, { ...init, headers, credentials: 'include' })
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init)
  if (!res.ok) {
    throw await parseApiError(res)
  }
  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}

export { API }
