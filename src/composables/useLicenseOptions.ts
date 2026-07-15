import { ref } from 'vue'
import {
  fetchLicenseAuthorities,
  fetchLicenseTypes,
  type LookupOption,
} from '@/api/licenseOptions'

const licenseTypes = ref<LookupOption[]>([])
const licenseAuthorities = ref<LookupOption[]>([])
const loading = ref(false)
const loaded = ref(false)
const error = ref<string | null>(null)

let loadPromise: Promise<void> | null = null

export function withLegacyLookupOption(options: LookupOption[], currentValue: string): LookupOption[] {
  const value = currentValue.trim()
  if (!value || options.some((option) => option.code === value)) {
    return options
  }
  return [...options, { code: value, name: `${value} (from logbook)` }]
}

export function useLicenseOptions() {
  async function load(): Promise<void> {
    if (loaded.value) return
    if (loadPromise) {
      await loadPromise
      return
    }

    loading.value = true
    error.value = null
    loadPromise = (async () => {
      try {
        const [types, authorities] = await Promise.all([fetchLicenseTypes(), fetchLicenseAuthorities()])
        licenseTypes.value = types
        licenseAuthorities.value = authorities
        loaded.value = true
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Could not load license options.'
      } finally {
        loading.value = false
        loadPromise = null
      }
    })()
    await loadPromise
  }

  return {
    licenseTypes,
    licenseAuthorities,
    loading,
    loaded,
    error,
    load,
  }
}
