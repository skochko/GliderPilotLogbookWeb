import { onMounted, onUnmounted, readonly, ref } from 'vue'
import { deferAfterLoad } from '@/lib/deferAfterLoad'
import { hasSeenEssentialCookiesNotice, markEssentialCookiesNoticeSeen } from '@/lib/cookieNotice'

const visible = ref(false)

export function useCookieNotice() {
  let cancelled = false

  onMounted(() => {
    deferAfterLoad(() => {
      if (cancelled) {
        return
      }
      visible.value = !hasSeenEssentialCookiesNotice()
    })
  })

  onUnmounted(() => {
    cancelled = true
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
