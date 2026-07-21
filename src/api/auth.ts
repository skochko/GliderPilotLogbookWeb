import { API, apiFetch, apiJson } from './client'
import { parseApiError } from './errors'
import { notifyAccountIncomplete } from './sessionInvalidation'
import type { UserMe } from '@/types'

export interface GoogleScopeStatus {
  available: boolean
  scopes: string[]
  sign_in: boolean
  drive_file: boolean
}

export function loginRedirect(): void {
  window.location.href = `${API}/auth/google`
}

export async function fetchGoogleScopes(): Promise<GoogleScopeStatus> {
  return apiJson<GoogleScopeStatus>('/auth/google/scopes')
}

export async function revokeGoogleAccess(): Promise<void> {
  await apiJson<void>('/auth/google/revoke', { method: 'POST' })
}

export function googleReconnectRedirect(returnTo = '/profile'): void {
  const params = new URLSearchParams({ return_to: `${window.location.origin}${returnTo}` })
  window.location.href = `${API}/auth/google/reconnect?${params.toString()}`
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
  const data: unknown = await res.json()
  if (data === null) {
    return null
  }
  return data as UserMe
}

export async function logout(): Promise<void> {
  await apiJson<void>('/auth/logout', { method: 'POST' })
}

export async function fetchGoogleAccessToken(): Promise<string> {
  const data = await apiJson<{ accessToken: string }>('/auth/google/access-token')
  return data.accessToken
}
