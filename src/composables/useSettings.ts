import { readonly, ref } from 'vue'
import * as settingsApi from '@/api/settings'
import { isApiError } from '@/api/errors'
import { applyDisplaySettingsFromSheet } from '@/composables/useDisplaySettings'
import type { SheetSettings, SheetSettingsPatch } from '@/types'

const settings = ref<SheetSettings | null>(null)
const loading = ref(false)
const initialized = ref(false)
const mutating = ref(false)
const error = ref<string | null>(null)

export function resetSettingsState(): void {
  settings.value = null
  loading.value = false
  initialized.value = false
  mutating.value = false
  error.value = null
}

export function useSettings() {
  async function fetch(): Promise<SheetSettings | null> {
    loading.value = true
    error.value = null
    try {
      settings.value = await settingsApi.getSettings()
      if (settings.value) {
        applyDisplaySettingsFromSheet(settings.value)
      }
      return settings.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load settings'
      return null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function save(payload: SheetSettingsPatch): Promise<SheetSettings | null> {
    mutating.value = true
    error.value = null
    try {
      settings.value = await settingsApi.updateSettings(payload)
      if (settings.value) {
        applyDisplaySettingsFromSheet(settings.value)
      }
      return settings.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to save settings'
      throw err
    } finally {
      mutating.value = false
    }
  }

  return {
    settings: readonly(settings),
    loading: readonly(loading),
    initialized: readonly(initialized),
    mutating: readonly(mutating),
    error: readonly(error),
    fetch,
    save,
  }
}
