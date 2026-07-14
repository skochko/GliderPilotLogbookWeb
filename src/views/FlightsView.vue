<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import ErrorBanner from '@/components/ErrorBanner.vue'
import FlightsTable from '@/components/FlightsTable.vue'
import LoadingState from '@/components/LoadingState.vue'
import LogbookSyncProgress from '@/components/LogbookSyncProgress.vue'
import SpinnerIcon from '@/components/SpinnerIcon.vue'
import { useFlights } from '@/composables/useFlights'
import { useDisplaySettings } from '@/composables/useDisplaySettings'
import { useLogbookSync } from '@/composables/useLogbookSync'

const {
  flights,
  loading,
  loadingMore,
  hasMore,
  listInitialized,
  error,
  list,
  loadMore,
} = useFlights()
const { displaySettings, ensureLoaded } = useDisplaySettings()
const { status, showProgress, isSyncing, syncError, startPolling, stopPolling } = useLogbookSync()

const loadMoreSentinel = ref<HTMLElement | null>(null)

let loadMoreObserver: IntersectionObserver | null = null

async function reloadFlights(): Promise<void> {
  await list(displaySettings.value?.sort_direction)
}

async function handleLoadMore(): Promise<void> {
  if (!hasMore.value || loadingMore.value) {
    return
  }
  await loadMore()
}

function bindLoadMoreObserver(): void {
  loadMoreObserver?.disconnect()
  if (!loadMoreSentinel.value) {
    return
  }

  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void handleLoadMore()
      }
    },
    { rootMargin: '200px 0px' },
  )
  loadMoreObserver.observe(loadMoreSentinel.value)
}

onMounted(async () => {
  void startPolling()
  await ensureLoaded()
  await reloadFlights()
  bindLoadMoreObserver()
})

onUnmounted(() => {
  loadMoreObserver?.disconnect()
  stopPolling()
})

watch(loadMoreSentinel, () => {
  bindLoadMoreObserver()
})

watch(
  () => displaySettings.value?.sort_direction,
  (direction, previous) => {
    if (!previous || !direction || direction === previous || !listInitialized.value) {
      return
    }
    void reloadFlights()
  },
)

watch(
  () => status.value?.flights_loaded,
  (count, previous) => {
    if (!showProgress.value || count === previous) {
      return
    }
    void reloadFlights()
  },
)

watch(isSyncing, (syncing, wasSyncing) => {
  if (wasSyncing && !syncing) {
    void reloadFlights()
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Flights</h1>
        <p class="mt-1 text-slate-600">Your flight log entries from Google Sheets.</p>
      </div>
      <RouterLink
        to="/flights/new"
        class="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
      >
        Add flight
      </RouterLink>
    </div>

    <LogbookSyncProgress
      v-if="showProgress && status"
      :loaded="status.loaded"
      :total="status.total"
      :percent="status.percent"
      :flights-loaded="status.flights_loaded"
    />

    <ErrorBanner v-if="syncError" :message="syncError" />

    <LoadingState v-if="!listInitialized && !showProgress" />
    <ErrorBanner v-else-if="error && !flights.length && !showProgress" :message="error" :retry-busy="loading" @retry="reloadFlights" />

    <div
      v-else-if="listInitialized && !flights.length && !isSyncing && !showProgress"
      class="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500"
    >
      No flights yet. Add your first flight to get started.
    </div>

    <div v-else-if="listInitialized && (flights.length || showProgress)" class="space-y-3">
      <ErrorBanner v-if="error && flights.length" :message="error" :retry-busy="loadingMore" @retry="handleLoadMore" />

      <FlightsTable v-if="flights.length" :flights="flights" />

      <div v-if="flights.length" ref="loadMoreSentinel" class="h-px" aria-hidden="true" />

      <div
        v-if="flights.length && (hasMore || loadingMore)"
        class="rounded-lg border border-slate-200 bg-white px-4 py-4 text-center shadow-sm"
      >
        <button
          v-if="hasMore && !loadingMore"
          type="button"
          class="text-sm font-medium text-sky-700 hover:text-sky-800 hover:underline"
          @click="handleLoadMore"
        >
          More
        </button>
        <div v-else class="flex items-center justify-center gap-2 text-sm text-slate-500">
          <SpinnerIcon />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  </div>
</template>
