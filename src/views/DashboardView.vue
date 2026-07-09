<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import RemarksDialog from '@/components/RemarksDialog.vue'
import { useStatistics } from '@/composables/useStatistics'
import { formatDayNumber, groupByMonth } from '@/lib/dates'
import { encodeFlightId } from '@/lib/flightId'
import { hasRemarks, truncateText } from '@/lib/text'
import type { Statistics } from '@/types'

type RecentActivity = Statistics['recent_activity'][number]

const { statistics, loading, initialized, error, fetch } = useStatistics()

const remarksOpen = ref(false)
const remarksText = ref('')
const remarksFlightId = ref<string | null>(null)

void fetch()

const maxGliderCount = computed(() => {
  const items = statistics.value?.flights_by_glider ?? []
  return Math.max(...items.map((i) => i.count), 1)
})

const maxLaunchCount = computed(() => {
  const items = statistics.value?.flights_by_launch_type ?? []
  return Math.max(...items.map((i) => i.count), 1)
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
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p class="mt-1 text-slate-600">Overview of your flying activity.</p>
    </div>

    <LoadingState v-if="!initialized" />
    <ErrorBanner v-else-if="error" :message="error" :retry-busy="loading" @retry="fetch" />

    <template v-else-if="statistics">
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm text-slate-500">Total flights</p>
          <p class="mt-1 text-3xl font-bold text-slate-900">{{ statistics.total_flights }}</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm text-slate-500">Flight hours</p>
          <p class="mt-1 text-3xl font-bold text-slate-900">{{ statistics.total_flight_hours }}</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm text-slate-500">Total launches</p>
          <p class="mt-1 text-3xl font-bold text-slate-900">{{ statistics.total_launches }}</p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="font-semibold text-slate-900">Flights by glider</h2>
          <ul class="mt-4 space-y-3">
            <li v-for="item in statistics.flights_by_glider" :key="item.glider">
              <div class="mb-1 flex justify-between text-sm">
                <span>{{ item.glider }}</span>
                <span class="text-slate-500">{{ item.count }} · {{ item.hours }}h</span>
              </div>
              <div class="h-2 rounded-full bg-slate-100">
                <div
                  class="h-2 rounded-full bg-sky-600"
                  :style="{ width: `${(item.count / maxGliderCount) * 100}%` }"
                />
              </div>
            </li>
            <li v-if="!statistics.flights_by_glider.length" class="text-sm text-slate-500">
              No data yet.
            </li>
          </ul>
        </section>

        <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="font-semibold text-slate-900">Flights by launch type</h2>
          <ul class="mt-4 space-y-3">
            <li v-for="item in statistics.flights_by_launch_type" :key="item.launch_type">
              <div class="mb-1 flex justify-between text-sm">
                <span>{{ item.launch_type }}</span>
                <span class="text-slate-500">{{ item.count }}</span>
              </div>
              <div class="h-2 rounded-full bg-slate-100">
                <div
                  class="h-2 rounded-full bg-emerald-600"
                  :style="{ width: `${(item.count / maxLaunchCount) * 100}%` }"
                />
              </div>
            </li>
            <li v-if="!statistics.flights_by_launch_type.length" class="text-sm text-slate-500">
              No data yet.
            </li>
          </ul>
        </section>
      </div>

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
                <th class="w-12 px-2 py-3 text-center font-medium sm:px-4">Day</th>
                <th class="px-4 py-3 font-medium">Glider</th>
                <th class="hidden px-4 py-3 font-medium sm:table-cell">Launch</th>
                <th class="px-4 py-3 font-medium">Time</th>
                <th class="hidden max-w-[12rem] px-4 py-3 font-medium lg:table-cell">Remarks</th>
                <th class="w-14 px-2 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in recentActivityGroups" :key="group.key">
                <tr class="border-t border-slate-200 bg-slate-100">
                  <td colspan="6" class="px-4 py-2 text-sm font-semibold text-slate-700">
                    {{ group.label }}
                  </td>
                </tr>
                <tr
                  v-for="(item, index) in group.items"
                  :key="item.id"
                  class="border-t border-slate-100"
                  :class="rowClass(item, index)"
                >
                  <td class="relative w-12 px-2 py-3 text-center font-medium tabular-nums text-slate-900 sm:px-4">
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
                  <td class="max-w-[8rem] truncate px-4 py-3 sm:max-w-none">
                    {{ item.glider }} {{ item.registration }}
                  </td>
                  <td class="hidden px-4 py-3 sm:table-cell">{{ item.launch_type || '—' }}</td>
                  <td class="px-4 py-3 whitespace-nowrap">{{ item.flight_time || '—' }}</td>
                  <td class="hidden max-w-[12rem] px-4 py-3 lg:table-cell">
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
                  <td class="px-2 py-3">
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
