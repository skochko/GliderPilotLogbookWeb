import { readonly, ref } from 'vue'

export type FlashKind = 'success' | 'error' | 'info'

const message = ref<string | null>(null)
const kind = ref<FlashKind>('info')

export function useFlashMessage() {
  function show(text: string, flashKind: FlashKind = 'info'): void {
    message.value = text
    kind.value = flashKind
  }

  function clear(): void {
    message.value = null
  }

  return {
    message: readonly(message),
    kind: readonly(kind),
    show,
    clear,
  }
}
