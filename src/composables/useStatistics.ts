import { readonly, ref } from 'vue'
import * as statisticsApi from '@/api/statistics'
import { isApiError } from '@/api/errors'
import type { Statistics } from '@/types'

const statistics = ref<Statistics | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

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
    }
  }

  return {
    statistics: readonly(statistics),
    loading: readonly(loading),
    error: readonly(error),
    fetch,
  }
}
