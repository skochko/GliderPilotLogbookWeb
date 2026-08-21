import { computed, readonly, ref } from 'vue'
import { getLogbookSyncStatus, requestLogbookSync } from '@/api/logbookSync'
import { useAuth } from '@/composables/useAuth'
import type { LogbookSyncStatus } from '@/types/logbookSync'

const POLL_INTERVAL_MS = 500

const status = ref<LogbookSyncStatus | null>(null)
const polling = ref(false)
const syncCompleteCount = ref(0)
const manualRefreshAvailableAt = ref<number | null>(null)
let pollTimer: ReturnType<typeof setTimeout> | null = null
let pollGeneration = 0
let manualSyncDeadline = 0
let manualSyncObserved = false

const showProgress = computed(() => status.value?.status === 'syncing')
const isSyncing = computed(() => status.value?.status === 'syncing')
const syncError = computed(() => (status.value?.status === 'error' ? status.value.error : null))

function clearPollTimer(): void {
  if (pollTimer !== null) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

function shouldKeepPolling(next: LogbookSyncStatus, hasLogbook: boolean): boolean {
  if (next.status === 'syncing') {
    return true
  }
  if (next.status === 'error') {
    return false
  }
  if (!manualSyncObserved && Date.now() < manualSyncDeadline) {
    return true
  }
  return hasLogbook && next.connected && next.last_synced_at === null
}

async function refreshSyncStatus(): Promise<LogbookSyncStatus> {
  const previousStatus = status.value?.status ?? null
  const next = await getLogbookSyncStatus()
  status.value = next
  if (next.status === 'syncing') {
    manualSyncObserved = true
  }
  if (previousStatus === 'syncing' && next.status === 'idle' && manualSyncObserved) {
    syncCompleteCount.value += 1
    manualSyncDeadline = 0
    manualSyncObserved = false
  }
  return next
}

function scheduleNextPoll(generation: number, hasLogbook: boolean): void {
  clearPollTimer()
  pollTimer = setTimeout(() => {
    void pollLoop(generation, hasLogbook)
  }, POLL_INTERVAL_MS)
}

async function pollLoop(generation: number, hasLogbook: boolean): Promise<void> {
  if (!polling.value || generation !== pollGeneration) {
    return
  }

  try {
    const next = await refreshSyncStatus()
    if (!polling.value || generation !== pollGeneration) {
      return
    }
    if (shouldKeepPolling(next, hasLogbook)) {
      scheduleNextPoll(generation, hasLogbook)
    } else {
      polling.value = false
    }
  } catch {
    if (polling.value && generation === pollGeneration) {
      scheduleNextPoll(generation, hasLogbook)
    }
  }
}

export function resetLogbookSyncState(): void {
  pollGeneration += 1
  polling.value = false
  clearPollTimer()
  status.value = null
  syncCompleteCount.value = 0
  manualRefreshAvailableAt.value = null
  manualSyncDeadline = 0
  manualSyncObserved = false
}

export function useLogbookSync() {
  const { user } = useAuth()
  const hasLogbook = computed(() => user.value?.has_logbook === true)

  async function startPolling(): Promise<LogbookSyncStatus | null> {
    pollGeneration += 1
    const generation = pollGeneration
    polling.value = true

    try {
      const next = await refreshSyncStatus()
      if (shouldKeepPolling(next, hasLogbook.value)) {
        scheduleNextPoll(generation, hasLogbook.value)
      } else {
        polling.value = false
      }
      return next
    } catch {
      polling.value = false
      return status.value
    }
  }

  async function requestSync(): Promise<LogbookSyncStatus> {
    const next = await requestLogbookSync()
    status.value = next
    manualRefreshAvailableAt.value = Date.now() + 60_000
    manualSyncDeadline = Date.now() + 10_000
    manualSyncObserved = false

    pollGeneration += 1
    const generation = pollGeneration
    polling.value = true
    scheduleNextPoll(generation, hasLogbook.value)
    return next
  }

  function stopPolling(): void {
    pollGeneration += 1
    polling.value = false
    clearPollTimer()
  }

  return {
    status: readonly(status),
    showProgress,
    isSyncing,
    syncError,
    syncCompleteCount: readonly(syncCompleteCount),
    manualRefreshAvailableAt: readonly(manualRefreshAvailableAt),
    refreshSyncStatus,
    requestSync,
    startPolling,
    stopPolling,
  }
}
