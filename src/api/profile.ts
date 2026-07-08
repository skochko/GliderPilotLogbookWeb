import { apiJson } from './client'
import type { Profile, ProfilePatch } from '@/types'

export function getProfile(): Promise<Profile> {
  return apiJson<Profile>('/profile')
}

export function updateProfile(payload: ProfilePatch): Promise<Profile> {
  return apiJson<Profile>('/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
