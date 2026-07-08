<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { useStatistics } from '@/composables/useStatistics'
import { formatDate } from '@/lib/dates'
import { useSettings } from '@/composables/useSettings'

const { statistics, loading, initialized, error, fetch } = useStatistics()
const { settings, fetch: fetchSettings } = useSettings()

onMounted(async () => {
  await fetchSettings()
  await fetch()
})

const maxGliderCount = computed(() => {
  const items = statistics.value?.flights_by_glider ?? []
  return Math.max(...items.map((i) => i.count), 1)
})

const maxLaunchCount = computed(() => {
  const items = statistics.value?.flights_by_launch_type ?? []
  return Math.max(...items.map((i) => i.count), 1)
})

function displayDate(iso: string): string {
  return formatDate(iso, settings.value?.date_format ?? '%Y-%m-%d')
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p class="mt-1 text-slate-600">Overview of your flying activity.</p>
    </div>

    <LoadingState v-if="!initialized && loading" />
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
                <th class="px-4 py-3 font-medium">Date</th>
                <th class="px-4 py-3 font-medium">Glider</th>
                <th class="px-4 py-3 font-medium">Launch</th>
                <th class="px-4 py-3 font-medium">Time</th>
                <th class="px-4 py-3 font-medium">Landings</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in statistics.recent_activity"
                :key="item.id"
                class="border-t border-slate-100"
                :class="{ 'bg-[var(--sheet-zebra-color)]': index % 2 === 1 }"
              >
                <td class="px-4 py-3">
                  <RouterLink :to="`/flights/${encodeURIComponent(item.id)}`" class="text-sky-700 hover:underline">
                    {{ displayDate(item.date) }}
                  </RouterLink>
                </td>
                <td class="px-4 py-3">{{ item.glider }} {{ item.registration }}</td>
                <td class="px-4 py-3">{{ item.launch_type }}</td>
                <td class="px-4 py-3">{{ item.flight_time }}</td>
                <td class="px-4 py-3">{{ item.landings }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
