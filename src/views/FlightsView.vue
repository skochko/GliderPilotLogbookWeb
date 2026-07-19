<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import ErrorBanner from '@/components/ErrorBanner.vue'
import FlightListFiltersDialog from '@/components/FlightListFiltersDialog.vue'
import FlightsTable from '@/components/FlightsTable.vue'
import FilterIcon from '@/components/icons/FilterIcon.vue'
import LoadingState from '@/components/LoadingState.vue'
import LogbookSyncProgress from '@/components/LogbookSyncProgress.vue'
import SpinnerIcon from '@/components/SpinnerIcon.vue'
import { useFlights } from '@/composables/useFlights'
import { useDisplaySettings } from '@/composables/useDisplaySettings'
import { useLogbookSync } from '@/composables/useLogbookSync'
import {
  emptyFlightListFilters,
  hasActiveFlightListFilters,
  sortPresetFromQuery,
  type FlightListSortPreset,
} from '@/lib/flightListQuery'
import type { FlightListFilters } from '@/types'

const {
  flights,
  total,
  loading,
  loadingMore,
  hasMore,
  listInitialized,
  error,
  listFilters,
  filterOptions,
  list,
  loadMore,
} = useFlights()
const { displaySettings, ensureLoaded } = useDisplaySettings()
const { status, showProgress, syncError, syncCompleteCount, startPolling, stopPolling } = useLogbookSync()

const loadMoreSentinel = ref<HTMLElement | null>(null)
const sortPreset = ref<FlightListSortPreset>('date_newest_first')
const draftFilters = ref<FlightListFilters>(emptyFlightListFilters())
const filtersOpen = ref(false)

let loadMoreObserver: IntersectionObserver | null = null

const hasActiveFilters = computed(() => hasActiveFlightListFilters(draftFilters.value))

function initialSortPreset(): FlightListSortPreset {
  const direction = displaySettings.value?.sort_direction ?? 'newest_first'
  return sortPresetFromQuery('date', direction)
}

async function reloadFlights(): Promise<void> {
  await list({
    sortPreset: sortPreset.value,
    filters: draftFilters.value,
  })
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
      if (loading.value || loadingMore.value || !listInitialized.value) {
        return
      }
      if (entries.some((entry) => entry.isIntersecting)) {
        void handleLoadMore()
      }
    },
    { rootMargin: '200px 0px' },
  )
  loadMoreObserver.observe(loadMoreSentinel.value)
}

function onFiltersApply(payload: { sortPreset: FlightListSortPreset; filters: FlightListFilters }): void {
  sortPreset.value = payload.sortPreset
  draftFilters.value = payload.filters
  filtersOpen.value = false
  void reloadFlights()
}

onMounted(async () => {
  window.scrollTo({ top: 0, left: 0 })
  void startPolling()
  await ensureLoaded()
  sortPreset.value = initialSortPreset()
  draftFilters.value = { ...listFilters.value }
  await reloadFlights()
  await nextTick()
  window.scrollTo({ top: 0, left: 0 })
  bindLoadMoreObserver()
})

onUnmounted(() => {
  loadMoreObserver?.disconnect()
  stopPolling()
})

watch(loadMoreSentinel, () => {
  bindLoadMoreObserver()
})

watch(syncCompleteCount, (count, previous) => {
  if (count > 0 && count !== previous) {
    void reloadFlights()
  }
})

watch(
  () => status.value?.flights_loaded,
  (count, previous) => {
    if (!showProgress.value || count === previous) {
      return
    }
    void reloadFlights()
  },
)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Flights</h1>
      <p class="mt-1 text-slate-600">Your flight log entries from Google Sheets.</p>
      <div class="mt-3 flex items-center justify-between gap-4">
        <RouterLink
          to="/flights/new"
          class="inline-flex items-center rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
        >
          Add flight
        </RouterLink>
        <button
          v-if="listInitialized || showProgress"
          type="button"
          class="relative inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition"
          :class="
            hasActiveFilters
              ? 'border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          "
          aria-label="Sort and filter flights"
          @click="filtersOpen = true"
        >
          <FilterIcon size="sm" />
          Filter
          <span
            v-if="hasActiveFilters"
            class="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-sky-600 ring-2 ring-white"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <FlightListFiltersDialog
      :open="filtersOpen"
      :sort-preset="sortPreset"
      :filters="draftFilters"
      :filter-options="filterOptions"
      :total="total"
      :loading="loading"
      @close="filtersOpen = false"
      @apply="onFiltersApply"
    />

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
      v-else-if="listInitialized && !flights.length && !showProgress"
      class="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500"
    >
      <template v-if="hasActiveFilters">
        No flights match your filters.
      </template>
      <template v-else>
        No flights yet. Add your first flight to get started.
      </template>
    </div>

    <div v-else-if="listInitialized && (flights.length || showProgress)" class="space-y-3">
      <ErrorBanner v-if="error && flights.length" :message="error" :retry-busy="loadingMore" @retry="handleLoadMore" />

      <p
        v-if="hasActiveFilters && listInitialized"
        class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
      >
        <span class="font-medium">{{ total }} flight{{ total === 1 ? '' : 's' }}</span>
        <span class="text-amber-800"> · Filtered</span>
      </p>

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
