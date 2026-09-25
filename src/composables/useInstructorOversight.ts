import { readonly, ref } from 'vue'
import * as instructorOversightApi from '@/api/instructorOversight'
import { isApiError } from '@/api/errors'
import type { ClubInstructorOverview } from '@/types/instructorOversight'

const overview = ref<ClubInstructorOverview | null>(null)
const loading = ref(false)
const initialized = ref(false)
const error = ref<string | null>(null)

export function resetInstructorOversightState(): void {
  overview.value = null
  loading.value = false
  initialized.value = false
  error.value = null
}

export function useInstructorOversight() {
  async function fetchOverview(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      overview.value = await instructorOversightApi.getClubInstructorOverview()
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load club instructors.'
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  return {
    overview: readonly(overview),
    loading: readonly(loading),
    initialized: readonly(initialized),
    error: readonly(error),
    fetchOverview,
  }
}
