import { readonly, ref } from 'vue'
import * as settingsApi from '@/api/settings'
import { applySheetTheme } from '@/lib/dates'
import type { SheetDisplaySettings, SheetSettings } from '@/types'

const displaySettings = ref<SheetDisplaySettings | null>(null)
const loading = ref(false)
const initialized = ref(false)

function applyTheme(data: SheetDisplaySettings): void {
  applySheetTheme(data.zebra_color, data.header_color)
}

export function resetDisplaySettingsState(): void {
  displaySettings.value = null
  loading.value = false
  initialized.value = false
}

export function setDisplaySettings(data: SheetDisplaySettings): void {
  displaySettings.value = data
  applyTheme(data)
  initialized.value = true
}

export function applyDisplaySettingsFromSheet(settings: SheetSettings): void {
  setDisplaySettings({
    sort_direction: settings.sort_direction,
    zebra_color: settings.zebra_color,
    header_color: settings.header_color,
  })
}

export function useDisplaySettings() {
  async function ensureLoaded(options: { force?: boolean } = {}): Promise<SheetDisplaySettings | null> {
    if (initialized.value && displaySettings.value && !options.force) {
      applyTheme(displaySettings.value)
      return displaySettings.value
    }
    if (loading.value) {
      return displaySettings.value
    }

    loading.value = true
    try {
      const data = await settingsApi.getDisplaySettings()
      setDisplaySettings(data)
      return data
    } catch {
      return displaySettings.value
    } finally {
      loading.value = false
    }
  }

  return {
    displaySettings: readonly(displaySettings),
    loading: readonly(loading),
    initialized: readonly(initialized),
    ensureLoaded,
    setDisplaySettings,
    applyDisplaySettingsFromSheet,
  }
}
