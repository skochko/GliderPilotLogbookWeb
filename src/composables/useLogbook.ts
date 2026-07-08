import { readonly, ref } from 'vue'
import * as logbookApi from '@/api/logbook'
import { isApiError } from '@/api/errors'
import type { LogbookStatus } from '@/types'

const status = ref<LogbookStatus | null>(null)
const loading = ref(false)
const initialized = ref(false)
const mutating = ref(false)
const error = ref<string | null>(null)

export function resetLogbookState(): void {
  status.value = null
  loading.value = false
  initialized.value = false
  mutating.value = false
  error.value = null
}

export function useLogbook() {
  async function fetchStatus(): Promise<LogbookStatus | null> {
    loading.value = true
    error.value = null
    try {
      status.value = await logbookApi.getLogbookStatus()
      return status.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load logbook status'
      status.value = null
      return null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function connect(payload: { url?: string; spreadsheet_id?: string }): Promise<boolean> {
    mutating.value = true
    error.value = null
    try {
      status.value = await logbookApi.connectLogbook(payload)
      return true
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to connect logbook'
      return false
    } finally {
      mutating.value = false
    }
  }

  async function disconnect(): Promise<boolean> {
    mutating.value = true
    error.value = null
    try {
      await logbookApi.disconnectLogbook()
      status.value = { connected: false, spreadsheet_id: '', title: '', sheets: [] }
      return true
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to disconnect logbook'
      return false
    } finally {
      mutating.value = false
    }
  }

  return {
    status: readonly(status),
    loading: readonly(loading),
    initialized: readonly(initialized),
    mutating: readonly(mutating),
    error: readonly(error),
    fetchStatus,
    connect,
    disconnect,
  }
}
