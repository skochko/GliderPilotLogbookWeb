import { readonly, ref } from 'vue'
import { getPage } from '@/api/pages'
import type { ApiErrorBody } from '@/types'
import type { Page, SitePageType } from '@/types'

const page = ref<Page | null>(null)
const loading = ref(false)
const initialized = ref(false)
const error = ref<string | null>(null)

function resetPageState(): void {
  page.value = null
  initialized.value = false
  error.value = null
}

async function fetch(pageType: SitePageType): Promise<void> {
  if (loading.value) return

  loading.value = true
  error.value = null

  try {
    page.value = await getPage(pageType)
  } catch (err) {
    page.value = null
    const apiError = err as ApiErrorBody
    error.value = apiError.message ?? 'Failed to load page'
  } finally {
    loading.value = false
    initialized.value = true
  }
}

export function usePage() {
  return {
    page: readonly(page),
    loading: readonly(loading),
    initialized: readonly(initialized),
    error: readonly(error),
    fetch,
    resetPageState,
  }
}
