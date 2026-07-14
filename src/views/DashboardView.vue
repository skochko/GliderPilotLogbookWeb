<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import DashboardFlyingTotals from '@/components/DashboardFlyingTotals.vue'
import DashboardLegalitySection from '@/components/DashboardLegalitySection.vue'
import DashboardMonthlyChart from '@/components/DashboardMonthlyChart.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import FlightsTable from '@/components/FlightsTable.vue'
import LoadingState from '@/components/LoadingState.vue'
import LogbookSyncProgress from '@/components/LogbookSyncProgress.vue'
import { RECENT_FLIGHTS_LIMIT, listFlights } from '@/api/flights'
import { isApiError } from '@/api/errors'
import { useDashboardStatus } from '@/composables/useDashboardStatus'
import { useDisplaySettings } from '@/composables/useDisplaySettings'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useLogbookSync } from '@/composables/useLogbookSync'
import { useStatistics } from '@/composables/useStatistics'
import type { Flight } from '@/types'

const { statistics, loading: statsLoading, initialized: statsInitialized, error: statsError, fetch: fetchStatistics } =
  useStatistics()
const {
  status: dashboardStatus,
  loading: statusLoading,
  initialized: statusInitialized,
  error: statusError,
  fetch: fetchDashboardStatus,
} = useDashboardStatus()
const { displaySettings, ensureLoaded } = useDisplaySettings()
const { clear: clearFlashMessage, kind: flashKind } = useFlashMessage()
const { status: syncStatus, showProgress, isSyncing, syncError, startPolling } = useLogbookSync()

const recentFlights = ref<Flight[]>([])
const recentFlightsLoading = ref(false)
const recentFlightsError = ref<string | null>(null)
const recentFlightsInitialized = ref(false)

const loading = computed(() => statsLoading.value || statusLoading.value || recentFlightsLoading.value)
const initialized = computed(() => statsInitialized.value && statusInitialized.value && recentFlightsInitialized.value)
const error = computed(() => statsError.value || statusError.value || syncError.value)

async function loadRecentFlights(): Promise<void> {
  recentFlightsLoading.value = true
  recentFlightsError.value = null
  try {
    const page = await listFlights({
      limit: RECENT_FLIGHTS_LIMIT,
      offset: 0,
      sort_direction: displaySettings.value?.sort_direction,
    })
    recentFlights.value = page.results
  } catch (err) {
    recentFlightsError.value = isApiError(err) ? err.message : 'Failed to load recent flights'
    recentFlights.value = []
  } finally {
    recentFlightsLoading.value = false
    recentFlightsInitialized.value = true
  }
}

async function fetchDashboard(): Promise<void> {
  void startPolling()
  await ensureLoaded()
  await Promise.all([fetchStatistics(), fetchDashboardStatus(), loadRecentFlights()])
}

void fetchDashboard()

watch(
  () => syncStatus.value?.flights_loaded,
  (count, previous) => {
    if (!showProgress.value || count === previous) {
      return
    }
    void loadRecentFlights()
  },
)

watch(isSyncing, (syncing, wasSyncing) => {
  if (wasSyncing && !syncing) {
    void Promise.all([fetchStatistics(), fetchDashboardStatus(), loadRecentFlights()])
  }
})

watch(initialized, (ready) => {
  if (ready && flashKind.value === 'success') {
    clearFlashMessage()
  }
})
</script>

<template>
  <div class="space-y-4 md:space-y-8">
    <div class="hidden md:block">
      <h1 class="text-xl font-semibold text-slate-900">Dashboard</h1>
      <p class="mt-0.5 text-sm text-slate-500">Overview of your flying activity.</p>
    </div>

    <LogbookSyncProgress
      v-if="showProgress && syncStatus"
      :loaded="syncStatus.loaded"
      :total="syncStatus.total"
      :percent="syncStatus.percent"
      :flights-loaded="syncStatus.flights_loaded"
    />

    <LoadingState v-if="!initialized && !showProgress" />
    <ErrorBanner
      v-else-if="error"
      :message="error"
      :retry-busy="loading"
      @retry="fetchDashboard"
    />

    <template v-else-if="statistics">
      <DashboardLegalitySection v-if="dashboardStatus" :status="dashboardStatus" />

      <DashboardMonthlyChart
        :monthly-data="statistics.flights_by_month ?? []"
        :weekly-data="statistics.flights_by_week ?? []"
      />

      <DashboardFlyingTotals :statistics="statistics" />

      <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 class="font-semibold text-slate-900">Recent activity</h2>
          <RouterLink
            to="/flights"
            class="text-sm font-medium text-sky-700 hover:text-sky-800 hover:underline"
          >
            View all
          </RouterLink>
        </div>
        <div v-if="recentFlightsError" class="px-5 py-4">
          <ErrorBanner
            :message="recentFlightsError"
            :retry-busy="recentFlightsLoading"
            @retry="loadRecentFlights"
          />
        </div>
        <div v-else-if="!recentFlights.length" class="px-5 py-8 text-sm text-slate-500">
          No flights recorded yet.
        </div>
        <FlightsTable v-else embedded :flights="recentFlights" />
      </section>
    </template>
  </div>
</template>
