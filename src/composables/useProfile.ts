import { readonly, ref } from 'vue'
import * as profileApi from '@/api/profile'
import { isApiError } from '@/api/errors'
import type { Profile, ProfilePatch } from '@/types'

const profile = ref<Profile | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useProfile() {
  async function fetch(): Promise<Profile | null> {
    loading.value = true
    error.value = null
    try {
      profile.value = await profileApi.getProfile()
      return profile.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load profile'
      return null
    } finally {
      loading.value = false
    }
  }

  async function save(payload: ProfilePatch): Promise<Profile | null> {
    loading.value = true
    error.value = null
    try {
      profile.value = await profileApi.updateProfile(payload)
      return profile.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to save profile'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    profile: readonly(profile),
    loading: readonly(loading),
    error: readonly(error),
    fetch,
    save,
  }
}
