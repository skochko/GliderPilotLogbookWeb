import { readonly, ref } from 'vue'
import * as dashboardApi from '@/api/dashboard'
import type { DashboardStatus } from '@/types'

const status = ref<DashboardStatus | null>(null)
const loading = ref(false)
const initialized = ref(false)
const error = ref<string | null>(null)

export function resetDashboardStatusState(): void {
  status.value = null
  loading.value = false
  initialized.value = false
  error.value = null
}

export function useDashboardStatus() {
  async function fetch(): Promise<DashboardStatus | null> {
    loading.value = true
    error.value = null
    try {
      status.value = await dashboardApi.getDashboardStatus()
      return status.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load dashboard status.'
      return null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  return {
    status: readonly(status),
    loading: readonly(loading),
    initialized: readonly(initialized),
    error: readonly(error),
    fetch,
  }
}
