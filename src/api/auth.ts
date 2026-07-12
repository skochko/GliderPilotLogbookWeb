import { API, apiFetch, apiJson } from './client'
import { parseApiError } from './errors'
import { notifyAccountIncomplete } from './sessionInvalidation'
import type { UserMe } from '@/types'

export function loginRedirect(): void {
  window.location.href = `${API}/auth/google`
}

export async function fetchMe(): Promise<UserMe | null> {
  const res = await apiFetch('/auth/me')
  if (res.status === 401 || res.status === 403) {
    const err = await parseApiError(res)
    if (err.code === 'ACCOUNT_INCOMPLETE') {
      await notifyAccountIncomplete(err.message)
    }
    return null
  }
  if (!res.ok) {
    throw await parseApiError(res)
  }
  return (await res.json()) as UserMe
}

export async function logout(): Promise<void> {
  await apiJson<void>('/auth/logout', { method: 'POST' })
}

export async function fetchGoogleAccessToken(): Promise<string> {
  const data = await apiJson<{ accessToken: string }>('/auth/google/access-token')
  return data.accessToken
}
