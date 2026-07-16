import { readonly, ref } from 'vue'
import * as authApi from '@/api/auth'
import { isApiError } from '@/api/errors'
import type { UserMe } from '@/types'

const user = ref<UserMe | null>(null)
const loading = ref(true)
const initialized = ref(false)
const mutating = ref(false)
const error = ref<string | null>(null)
let fetchMeInFlight: Promise<UserMe | null> | null = null

export function clearSession(): void {
  user.value = null
}

export function useAuth() {
  async function fetchMe(): Promise<UserMe | null> {
    if (fetchMeInFlight) {
      return fetchMeInFlight
    }

    fetchMeInFlight = (async () => {
      loading.value = true
      error.value = null
      try {
        user.value = await authApi.fetchMe()
        return user.value
      } catch (err) {
        error.value = isApiError(err) ? err.message : 'Failed to load user'
        user.value = null
        return null
      } finally {
        loading.value = false
        initialized.value = true
        fetchMeInFlight = null
      }
    })()

    return fetchMeInFlight
  }

  function login(): void {
    authApi.loginRedirect()
  }

  async function logout(): Promise<void> {
    mutating.value = true
    error.value = null
    try {
      await authApi.logout()
      user.value = null
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Logout failed'
    } finally {
      mutating.value = false
    }
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    initialized: readonly(initialized),
    mutating: readonly(mutating),
    error: readonly(error),
    fetchMe,
    login,
    logout,
  }
}
