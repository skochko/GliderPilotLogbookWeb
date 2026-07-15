import { computed, ref } from 'vue'
import { fetchPilotPrivileges, type PilotPrivilegeOption } from '@/api/pilotPrivileges'

const options = ref<PilotPrivilegeOption[]>([])
const loading = ref(false)
const loaded = ref(false)
const error = ref<string | null>(null)

let loadPromise: Promise<void> | null = null

export function usePilotPrivileges() {
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
        options.value = await fetchPilotPrivileges()
        loaded.value = true
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Could not load pilot privileges.'
      } finally {
        loading.value = false
        loadPromise = null
      }
    })()
    await loadPromise
  }

  function isInstructorPrivilege(code: string): boolean {
    const match = options.value.find((option) => option.code === code)
    if (match) return match.is_instructor
    return code === 'BI' || code === 'FI'
  }

  const defaultCode = computed(
    () =>
      options.value.find((option) => option.code === 'SPL Pilot')?.code ??
      options.value[0]?.code ??
      'SPL Pilot',
  )

  return {
    options,
    loading,
    loaded,
    error,
    defaultCode,
    load,
    isInstructorPrivilege,
  }
}

export function isBiPrivilege(code: string): boolean {
  return code === 'BI'
}

export function isFiPrivilege(code: string): boolean {
  return code === 'FI'
}
