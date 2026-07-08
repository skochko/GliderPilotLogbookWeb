import { computed, readonly, ref } from 'vue'
import * as summaryApi from '@/api/summary'
import { isApiError } from '@/api/errors'
import type { MedicalBlock, Summary, SummaryPatch } from '@/types'

const summary = ref<Summary | null>(null)
const medical = ref<MedicalBlock | null>(null)
const summaryLoading = ref(false)
const medicalLoading = ref(false)
const summaryInitialized = ref(false)
const medicalInitialized = ref(false)
const mutating = ref(false)
const error = ref<string | null>(null)

const loading = computed(() => summaryLoading.value || medicalLoading.value)
const initialized = computed(() => summaryInitialized.value && medicalInitialized.value)

export function useSummary() {
  async function fetchSummary(): Promise<Summary | null> {
    summaryLoading.value = true
    error.value = null
    try {
      summary.value = await summaryApi.getSummary()
      return summary.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load summary'
      return null
    } finally {
      summaryLoading.value = false
      summaryInitialized.value = true
    }
  }

  async function saveSummary(payload: SummaryPatch): Promise<Summary | null> {
    mutating.value = true
    error.value = null
    try {
      summary.value = await summaryApi.updateSummary(payload)
      return summary.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to save summary'
      throw err
    } finally {
      mutating.value = false
    }
  }

  async function fetchMedical(): Promise<MedicalBlock | null> {
    medicalLoading.value = true
    error.value = null
    try {
      medical.value = await summaryApi.getMedical()
      return medical.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load medical records'
      return null
    } finally {
      medicalLoading.value = false
      medicalInitialized.value = true
    }
  }

  async function saveMedical(payload: MedicalBlock): Promise<MedicalBlock | null> {
    mutating.value = true
    error.value = null
    try {
      medical.value = await summaryApi.updateMedical(payload)
      return medical.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to save medical records'
      throw err
    } finally {
      mutating.value = false
    }
  }

  return {
    summary: readonly(summary),
    medical: readonly(medical),
    loading,
    initialized,
    mutating: readonly(mutating),
    error: readonly(error),
    fetchSummary,
    saveSummary,
    fetchMedical,
    saveMedical,
  }
}
