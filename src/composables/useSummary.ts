import { readonly, ref } from 'vue'
import * as summaryApi from '@/api/summary'
import { isApiError } from '@/api/errors'
import type { MedicalBlock, Summary, SummaryPatch } from '@/types'

const summary = ref<Summary | null>(null)
const medical = ref<MedicalBlock | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useSummary() {
  async function fetchSummary(): Promise<Summary | null> {
    loading.value = true
    error.value = null
    try {
      summary.value = await summaryApi.getSummary()
      return summary.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load summary'
      return null
    } finally {
      loading.value = false
    }
  }

  async function saveSummary(payload: SummaryPatch): Promise<Summary | null> {
    loading.value = true
    error.value = null
    try {
      summary.value = await summaryApi.updateSummary(payload)
      return summary.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to save summary'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchMedical(): Promise<MedicalBlock | null> {
    loading.value = true
    error.value = null
    try {
      medical.value = await summaryApi.getMedical()
      return medical.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load medical records'
      return null
    } finally {
      loading.value = false
    }
  }

  async function saveMedical(payload: MedicalBlock): Promise<MedicalBlock | null> {
    loading.value = true
    error.value = null
    try {
      medical.value = await summaryApi.updateMedical(payload)
      return medical.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to save medical records'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    summary: readonly(summary),
    medical: readonly(medical),
    loading: readonly(loading),
    error: readonly(error),
    fetchSummary,
    saveSummary,
    fetchMedical,
    saveMedical,
  }
}
