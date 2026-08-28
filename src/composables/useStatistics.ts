import { readonly, ref } from 'vue'
import * as statisticsApi from '@/api/statistics'
import { isApiError } from '@/api/errors'
import type { Statistics, StatisticsQuery } from '@/types'

const statistics = ref<Statistics | null>(null)
const loading = ref(false)
const initialized = ref(false)
const error = ref<string | null>(null)
let latestRequestId = 0

export function resetStatisticsState(): void {
  latestRequestId += 1
  statistics.value = null
  loading.value = false
  initialized.value = false
  error.value = null
}

export function useStatistics() {
  async function fetch(query?: StatisticsQuery): Promise<Statistics | null> {
    const requestId = ++latestRequestId
    loading.value = true
    error.value = null
    try {
      const result = await statisticsApi.getStatistics(query)
      if (requestId === latestRequestId) {
        statistics.value = result
      }
      return result
    } catch (err) {
      if (requestId === latestRequestId) {
        error.value = isApiError(err) ? err.message : 'Failed to load statistics'
        statistics.value = null
      }
      return null
    } finally {
      if (requestId === latestRequestId) {
        loading.value = false
        initialized.value = true
      }
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
