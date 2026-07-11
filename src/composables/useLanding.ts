import { ref } from 'vue'
import { getLandingContent } from '@/api/landing'
import type { LandingContent, LandingScreenshot, LandingScreenshotSlot } from '@/types/landing'

const content = ref<LandingContent | null>(null)
const loading = ref(false)
const initialized = ref(false)
const error = ref<string | null>(null)

export function useLanding() {
  async function fetchLanding(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      content.value = await getLandingContent()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load landing content'
      content.value = { screenshots: [] }
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  function screenshotFor(slot: LandingScreenshotSlot): LandingScreenshot | undefined {
    return content.value?.screenshots.find((item) => item.slot === slot)
  }

  return {
    content,
    loading,
    initialized,
    error,
    fetchLanding,
    screenshotFor,
  }
}
