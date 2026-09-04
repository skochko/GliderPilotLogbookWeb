import { readonly, ref } from 'vue'
import { useProfile } from '@/composables/useProfile'
import { measurementUnitsFromPreferences, type MeasurementUnits } from '@/lib/measurementUnits'

const units = ref<MeasurementUnits>('metric')
const saving = ref(false)

export function resetMeasurementUnitsState(): void {
  units.value = 'metric'
  saving.value = false
}

export function useMeasurementUnits() {
  const { profile, initialized, fetch, save } = useProfile()

  function syncFromProfile(): void {
    units.value = measurementUnitsFromPreferences(profile.value?.preferences)
  }

  function setUnitsLocally(next: MeasurementUnits): void {
    units.value = next
  }

  async function ensureLoaded(): Promise<void> {
    if (!initialized.value) await fetch()
    syncFromProfile()
  }

  async function setUnits(next: MeasurementUnits): Promise<void> {
    if (next === units.value || saving.value) return
    const previous = units.value
    units.value = next
    saving.value = true
    try {
      const preferences = { ...(profile.value?.preferences ?? {}), measurement_units: next }
      await save({ preferences })
      syncFromProfile()
    } catch (error) {
      units.value = previous
      throw error
    } finally {
      saving.value = false
    }
  }

  return {
    units: readonly(units),
    saving: readonly(saving),
    ensureLoaded,
    setUnits,
    setUnitsLocally,
    syncFromProfile,
  }
}
