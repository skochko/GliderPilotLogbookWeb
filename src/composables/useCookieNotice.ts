import { onMounted, readonly, ref } from 'vue'
import { hasSeenEssentialCookiesNotice, markEssentialCookiesNoticeSeen } from '@/lib/cookieNotice'

const visible = ref(false)

export function useCookieNotice() {
  onMounted(() => {
    visible.value = !hasSeenEssentialCookiesNotice()
  })

  function dismiss(): void {
    markEssentialCookiesNoticeSeen()
    visible.value = false
  }

  return {
    visible: readonly(visible),
    dismiss,
  }
}

/** Test helper */
export function resetCookieNoticeState(): void {
  visible.value = false
}
