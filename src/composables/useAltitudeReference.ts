import { readonly, ref } from 'vue'
import { useProfile } from '@/composables/useProfile'

export type AltitudeReference = 'qnh' | 'qfe'

const altitudeReference = ref<AltitudeReference>('qnh')
const saving = ref(false)

function valueFromPreferences(preferences: Record<string, unknown> | null | undefined) {
  return preferences?.altitude_reference === 'qfe' ? 'qfe' : 'qnh'
}

export function resetAltitudeReferenceState(): void {
  altitudeReference.value = 'qnh'
  saving.value = false
}

export function useAltitudeReference() {
  const { profile, initialized, fetch, save } = useProfile()

  async function ensureLoaded(): Promise<void> {
    if (!initialized.value) await fetch()
    altitudeReference.value = valueFromPreferences(profile.value?.preferences)
  }

  async function setAltitudeReference(next: AltitudeReference, persist = true): Promise<void> {
    if (next === altitudeReference.value || saving.value) return
    const previous = altitudeReference.value
    altitudeReference.value = next
    if (!persist) return

    saving.value = true
    try {
      const preferences = { ...(profile.value?.preferences ?? {}), altitude_reference: next }
      await save({ preferences })
      altitudeReference.value = valueFromPreferences(profile.value?.preferences)
    } catch (error) {
      altitudeReference.value = previous
      throw error
    } finally {
      saving.value = false
    }
  }

  return {
    altitudeReference: readonly(altitudeReference),
    saving: readonly(saving),
    ensureLoaded,
    setAltitudeReference,
  }
}
