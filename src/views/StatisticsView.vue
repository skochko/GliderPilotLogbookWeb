<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import DashboardFlyingTotals from '@/components/DashboardFlyingTotals.vue'
import DashboardMonthlyChart from '@/components/DashboardMonthlyChart.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import StatisticsBreakdownTables from '@/components/StatisticsBreakdownTables.vue'
import StatisticsPeriodControls from '@/components/StatisticsPeriodControls.vue'
import StatisticsSummaryCards from '@/components/StatisticsSummaryCards.vue'
import { getProfile } from '@/api/profile'
import { useStatistics } from '@/composables/useStatistics'
import { useStatisticsPeriod } from '@/composables/useStatisticsPeriod'
import { isValidStatisticsPeriod, preferredChartMode } from '@/lib/statisticsPeriod'

const { statistics, loading, initialized, error, fetch } = useStatistics()
const {
  period,
  preset,
  saving,
  initializeFromPreferences,
  applyPreset,
  setFrom,
  setTo,
} = useStatisticsPeriod()

const chartMode = computed(() => preferredChartMode(period.value))
const hasPeriodData = computed(
  () => (statistics.value?.total_flights ?? 0) > 0 || (statistics.value?.days_flown ?? 0) > 0,
)
const periodReady = ref(false)

async function loadStatistics(): Promise<void> {
  if (!isValidStatisticsPeriod(period.value)) {
    return
  }
  await fetch({ from: period.value.from, to: period.value.to })
}

onMounted(async () => {
  try {
    const profile = await getProfile()
    initializeFromPreferences(profile.preferences)
  } catch {
    initializeFromPreferences(undefined)
  }
  periodReady.value = true
  await loadStatistics()
})

watch(
  period,
  (next, previous) => {
    if (!periodReady.value || (next.from === previous.from && next.to === previous.to)) {
      return
    }
    if (isValidStatisticsPeriod(next)) {
      void loadStatistics()
    }
  },
  { deep: true },
)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Statistics</h1>
      <p class="mt-1 text-slate-600">Your flying activity for a selected period.</p>
    </div>

    <StatisticsPeriodControls
      :from="period.from"
      :to="period.to"
      :preset="preset"
      :saving="saving"
      @update:from="setFrom"
      @update:to="setTo"
      @preset="applyPreset"
    />

    <LoadingState v-if="!initialized || (loading && !statistics)" label="Loading statistics…" />
    <ErrorBanner
      v-else-if="error && !statistics"
      :message="error"
      :retry-busy="loading"
      @retry="loadStatistics"
    />

    <template v-else-if="statistics">
      <ErrorBanner v-if="error" :message="error" :retry-busy="loading" @retry="loadStatistics" />

      <div
        v-if="!hasPeriodData"
        class="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500"
      >
        No flights in this period.
      </div>

      <template v-else>
        <StatisticsSummaryCards :statistics="statistics" />
        <DashboardMonthlyChart
          :monthly-data="statistics.flights_by_month ?? []"
          :weekly-data="statistics.flights_by_week ?? []"
          :default-period-mode="chartMode"
        />
        <DashboardFlyingTotals :statistics="statistics" />
        <StatisticsBreakdownTables :statistics="statistics" />
      </template>
    </template>
  </div>
</template>
