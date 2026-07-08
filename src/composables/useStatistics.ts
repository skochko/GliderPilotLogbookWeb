import { readonly, ref } from 'vue'
import * as statisticsApi from '@/api/statistics'
import { isApiError } from '@/api/errors'
import type { Statistics } from '@/types'

const statistics = ref<Statistics | null>(null)
const loading = ref(false)
const initialized = ref(false)
const error = ref<string | null>(null)

export function resetStatisticsState(): void {
  statistics.value = null
  loading.value = false
  initialized.value = false
  error.value = null
}

export function useStatistics() {
  async function fetch(): Promise<Statistics | null> {
    loading.value = true
    error.value = null
    try {
      statistics.value = await statisticsApi.getStatistics()
      return statistics.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load statistics'
      return null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  return {
    statistics: readonly(statistics),
    loading: readonly(loading),
    initialized: readonly(initialized),
    error: readonly(error),
    fetch,
  }
}
