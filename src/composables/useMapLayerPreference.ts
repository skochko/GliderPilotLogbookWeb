import { readonly, ref } from 'vue'
import { useProfile } from '@/composables/useProfile'

export type MapLayerPreference = 'street' | 'satellite'

const mapLayer = ref<MapLayerPreference>('street')
const saving = ref(false)

function valueFromPreferences(preferences: Record<string, unknown> | null | undefined) {
  return preferences?.map_layer === 'satellite' ? 'satellite' : 'street'
}

export function resetMapLayerPreferenceState(): void {
  mapLayer.value = 'street'
  saving.value = false
}

export function useMapLayerPreference() {
  const { profile, initialized, fetch, save } = useProfile()

  async function ensureLoaded(): Promise<void> {
    if (!initialized.value) await fetch()
    mapLayer.value = valueFromPreferences(profile.value?.preferences)
  }

  async function setMapLayer(next: MapLayerPreference, persist = true): Promise<void> {
    if (next === mapLayer.value || saving.value) return
    const previous = mapLayer.value
    mapLayer.value = next
    if (!persist) return

    saving.value = true
    try {
      const preferences = { ...(profile.value?.preferences ?? {}), map_layer: next }
      await save({ preferences })
      mapLayer.value = valueFromPreferences(profile.value?.preferences)
    } catch (error) {
      mapLayer.value = previous
      throw error
    } finally {
      saving.value = false
    }
  }

  return { mapLayer: readonly(mapLayer), saving: readonly(saving), ensureLoaded, setMapLayer }
}
