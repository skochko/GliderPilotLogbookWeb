import { readonly, ref } from 'vue'

export type ToastKind = 'success' | 'error' | 'info'

const visible = ref(false)
const message = ref<string | null>(null)
const kind = ref<ToastKind>('info')

let hideTimer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  function show(text: string, toastKind: ToastKind = 'info', durationMs = 10_000): void {
    message.value = text
    kind.value = toastKind
    visible.value = true

    if (hideTimer) {
      clearTimeout(hideTimer)
    }
    hideTimer = setTimeout(() => {
      dismiss()
    }, durationMs)
  }

  function dismiss(): void {
    visible.value = false
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  return {
    visible: readonly(visible),
    message: readonly(message),
    kind: readonly(kind),
    show,
    dismiss,
  }
}

/** Test helper */
export function resetToastState(): void {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  visible.value = false
  message.value = null
  kind.value = 'info'
}
