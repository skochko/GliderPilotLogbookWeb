import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useLogbook } from '@/composables/useLogbook'
import { resetLogbookState } from '@/composables/resetLogbookState'

export function useLogbookDisconnect() {
  const router = useRouter()
  const { fetchMe } = useAuth()
  const { disconnect, mutating, error } = useLogbook()
  const { show } = useFlashMessage()

  async function disconnectLogbook(): Promise<boolean> {
    if (mutating.value) return false

    const ok = await disconnect()
    if (!ok) {
      show(error.value ?? 'Failed to disconnect logbook', 'error')
      return false
    }

    resetLogbookState()
    await fetchMe()
    show('Logbook disconnected.', 'success')
    await router.push('/connect')
    return true
  }

  return {
    disconnectLogbook,
    disconnecting: mutating,
  }
}
