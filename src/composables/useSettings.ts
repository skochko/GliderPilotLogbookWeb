import { readonly, ref } from 'vue'
import * as settingsApi from '@/api/settings'
import { applySheetTheme } from '@/lib/dates'
import { isApiError } from '@/api/errors'
import type { SheetSettings, SheetSettingsPatch } from '@/types'

const settings = ref<SheetSettings | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useSettings() {
  async function fetch(): Promise<SheetSettings | null> {
    loading.value = true
    error.value = null
    try {
      settings.value = await settingsApi.getSettings()
      if (settings.value) {
        applySheetTheme(settings.value.zebra_color, settings.value.header_color)
      }
      return settings.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load settings'
      return null
    } finally {
      loading.value = false
    }
  }

  async function save(payload: SheetSettingsPatch): Promise<SheetSettings | null> {
    loading.value = true
    error.value = null
    try {
      settings.value = await settingsApi.updateSettings(payload)
      if (settings.value) {
        applySheetTheme(settings.value.zebra_color, settings.value.header_color)
      }
      return settings.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to save settings'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    settings: readonly(settings),
    loading: readonly(loading),
    error: readonly(error),
    fetch,
    save,
  }
}
