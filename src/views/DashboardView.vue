<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DeepReadonly } from 'vue'
import { RouterLink } from 'vue-router'
import DashboardFlyingTotals from '@/components/DashboardFlyingTotals.vue'
import DashboardLegalitySection from '@/components/DashboardLegalitySection.vue'
import DashboardMonthlyChart from '@/components/DashboardMonthlyChart.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import RemarksDialog from '@/components/RemarksDialog.vue'
import { useDashboardStatus } from '@/composables/useDashboardStatus'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useStatistics } from '@/composables/useStatistics'
import { formatDurationDisplay } from '@/lib/duration'
import { formatDayNumber, groupByMonth } from '@/lib/dates'
import { encodeFlightId } from '@/lib/flightId'
import { pilotRoleLabel, pilotRoleStyles, formatRoleCompanionDisplay, roleCompanionName } from '@/lib/pilotRoles'
import { hasRemarks, truncateText } from '@/lib/text'
import type { Statistics } from '@/types'

type RecentActivity = DeepReadonly<Statistics['recent_activity'][number]>

const { statistics, loading: statsLoading, initialized: statsInitialized, error: statsError, fetch: fetchStatistics } =
  useStatistics()
const {
  status: dashboardStatus,
  loading: statusLoading,
  initialized: statusInitialized,
  error: statusError,
  fetch: fetchDashboardStatus,
} = useDashboardStatus()
const { clear: clearFlashMessage, kind: flashKind } = useFlashMessage()

const remarksOpen = ref(false)
const remarksText = ref('')
const remarksFlightId = ref<string | null>(null)

const loading = computed(() => statsLoading.value || statusLoading.value)
const initialized = computed(() => statsInitialized.value && statusInitialized.value)
const error = computed(() => statsError.value || statusError.value)

async function fetchDashboard(): Promise<void> {
  await Promise.all([fetchStatistics(), fetchDashboardStatus()])
}

void fetchDashboard()

watch(initialized, (ready) => {
  if (ready && flashKind.value === 'success') {
    clearFlashMessage()
  }
})

const recentActivityGroups = computed(() =>
  groupByMonth(statistics.value?.recent_activity ?? []),
)

function rowClass(item: RecentActivity, index: number): string {
  const classes: string[] = []
  if (index % 2 === 1) {
    classes.push('bg-[var(--sheet-zebra-color)]')
  }
  if (hasRemarks(item.remarks)) {
    classes.push('border-l-2 border-l-amber-400')
  }
  return classes.join(' ')
}

function openRemarks(item: RecentActivity): void {
  remarksText.value = item.remarks.trim()
  remarksFlightId.value = item.id
  remarksOpen.value = true
}
</script>

<template>
  <div class="space-y-4 md:space-y-8">
    <div class="hidden md:block">
      <h1 class="text-xl font-semibold text-slate-900">Dashboard</h1>
      <p class="mt-0.5 text-sm text-slate-500">Overview of your flying activity.</p>
    </div>

    <LoadingState v-if="!initialized" />
    <ErrorBanner
      v-else-if="error"
      :message="error"
      :retry-busy="loading"
      @retry="fetchDashboard"
    />

    <template v-else-if="statistics">
      <DashboardLegalitySection v-if="dashboardStatus" :status="dashboardStatus" />

      <DashboardMonthlyChart :data="statistics.flights_by_month ?? []" />

      <DashboardFlyingTotals :statistics="statistics" />

      <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 px-5 py-4">
          <h2 class="font-semibold text-slate-900">Recent activity</h2>
        </div>
        <div v-if="!statistics.recent_activity.length" class="px-5 py-8 text-sm text-slate-500">
          No flights recorded yet.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-[var(--sheet-header-color)] text-left text-slate-700">
              <tr>
                <th class="w-12 px-2 py-2 text-center font-medium sm:px-4">Day</th>
                <th class="px-3 py-2 font-medium">Role</th>
                <th class="px-4 py-2 font-medium">Glider</th>
                <th class="hidden px-4 py-2 font-medium sm:table-cell">Launch</th>
                <th class="px-4 py-2 font-medium">Time</th>
                <th class="hidden max-w-[12rem] px-4 py-2 font-medium lg:table-cell">Remarks</th>
                <th class="w-14 px-2 py-2 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in recentActivityGroups" :key="group.key">
                <tr class="border-t border-slate-200 bg-slate-100">
                  <td colspan="7" class="px-4 py-1.5 text-sm font-semibold text-slate-700">
                    {{ group.label }}
                  </td>
                </tr>
                <tr
                  v-for="(item, index) in group.items"
                  :key="item.id"
                  class="border-t border-slate-100"
                  :class="rowClass(item, index)"
                >
                  <td class="relative w-12 px-2 py-2 text-center font-medium tabular-nums text-slate-900 sm:px-4">
                    <button
                      v-if="hasRemarks(item.remarks)"
                      type="button"
                      class="absolute left-0 top-1/2 -translate-y-1/2 rounded p-1 text-amber-600 hover:bg-amber-50 lg:hidden"
                      aria-label="View remarks"
                      @click.stop="openRemarks(item)"
                    >
                      <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 4h16a1 1 0 011 1v11a1 1 0 01-1 1H8l-4 3V5a1 1 0 011-1z" />
                      </svg>
                    </button>
                    {{ formatDayNumber(item.date) }}
                  </td>
                  <td class="px-3 py-2">
                    <div v-if="item.pilot_roles?.length" class="inline-flex flex-nowrap items-center gap-1">
                      <span
                        v-for="role in item.pilot_roles"
                        :key="role"
                        class="inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset"
                        :class="pilotRoleStyles[role]"
                      >
                        {{ pilotRoleLabel(role) }}
                      </span>
                    </div>
                    <span v-else class="text-slate-300">—</span>
                    <p
                      v-if="roleCompanionName(item.pilot_roles ?? [], item)"
                      class="mt-0.5 truncate text-xs text-slate-500"
                      :title="roleCompanionName(item.pilot_roles ?? [], item)"
                    >
                      {{ formatRoleCompanionDisplay(item.pilot_roles ?? [], item) }}
                    </p>
                  </td>
                  <td class="max-w-[8rem] px-4 py-2 sm:max-w-none">
                    <p class="truncate text-slate-900">{{ item.glider }}</p>
                    <p v-if="item.registration?.trim()" class="mt-0.5 truncate text-xs text-slate-500">
                      {{ item.registration.trim() }}
                    </p>
                  </td>
                  <td class="hidden px-4 py-2 sm:table-cell">{{ item.launch_type || '—' }}</td>
                  <td class="px-4 py-2 whitespace-nowrap">{{ formatDurationDisplay(item.flight_time) }}</td>
                  <td class="hidden max-w-[12rem] px-4 py-2 lg:table-cell">
                    <button
                      v-if="hasRemarks(item.remarks)"
                      type="button"
                      class="block max-w-full truncate text-left text-sm text-amber-900 hover:text-amber-700 hover:underline"
                      :title="item.remarks.trim()"
                      @click="openRemarks(item)"
                    >
                      {{ truncateText(item.remarks, 48) }}
                    </button>
                    <span v-else class="text-slate-300">—</span>
                  </td>
                  <td class="px-2 py-2">
                    <div class="flex items-center justify-center">
                      <RouterLink
                        :to="`/flights/${encodeFlightId(item.id)}`"
                        class="inline-flex rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-sky-700"
                        title="Edit"
                        aria-label="Edit flight"
                      >
                        <svg
                          class="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                          aria-hidden="true"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                      </RouterLink>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <RemarksDialog
      :open="remarksOpen"
      :text="remarksText"
      :flight-id="remarksFlightId"
      @close="remarksOpen = false"
    />
  </div>
</template>
