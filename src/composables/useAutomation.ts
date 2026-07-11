import { readonly, ref } from 'vue'
import * as automationApi from '@/api/automation'
import { isApiError } from '@/api/errors'
import type { AutomationRequest, AutomationRequestCreatePayload } from '@/api/automation'

const requests = ref<AutomationRequest[]>([])
const loading = ref(false)
const initialized = ref(false)
const mutating = ref(false)
const error = ref<string | null>(null)

export function resetAutomationState(): void {
  requests.value = []
  loading.value = false
  initialized.value = false
  mutating.value = false
  error.value = null
}

export function useAutomation() {
  async function fetch(): Promise<AutomationRequest[]> {
    loading.value = true
    error.value = null
    try {
      requests.value = await automationApi.listAutomationRequests()
      return requests.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load automation requests'
      return []
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function create(
    payload: AutomationRequestCreatePayload,
  ): Promise<AutomationRequest | null> {
    mutating.value = true
    error.value = null
    try {
      const created = await automationApi.createAutomationRequest(payload)
      requests.value = [created, ...requests.value]
      return created
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to create automation request'
      return null
    } finally {
      mutating.value = false
    }
  }

  return {
    requests: readonly(requests),
    loading: readonly(loading),
    initialized: readonly(initialized),
    mutating: readonly(mutating),
    error: readonly(error),
    fetch,
    create,
  }
}
