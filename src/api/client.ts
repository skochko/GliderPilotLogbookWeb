import { parseApiError } from './errors'
import { notifyAccountIncomplete } from './sessionInvalidation'

const API = import.meta.env.VITE_API_URL as string
const DEFAULT_TIMEOUT_MS = 30_000

let csrfTokenPromise: Promise<string> | null = null

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch(`${API}/auth/csrf`, { credentials: 'include' })
  if (!res.ok) {
    throw new Error('Failed to fetch CSRF token')
  }
  const data = (await res.json()) as { csrfToken: string }
  return data.csrfToken
}

export async function getCsrfToken(): Promise<string> {
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

  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (init.signal) {
    return fetch(`${API}${path}`, { ...init, headers, credentials: 'include' })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    return await fetch(`${API}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

async function rejectApiResponse(res: Response): Promise<never> {
  const err = await parseApiError(res)
  if (err.code === 'ACCOUNT_INCOMPLETE') {
    await notifyAccountIncomplete(err.message)
  }
  throw err
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init)
  if (!res.ok) {
    return rejectApiResponse(res)
  }
  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}

export { API }
