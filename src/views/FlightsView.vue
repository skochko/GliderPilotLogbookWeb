<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { useFlights } from '@/composables/useFlights'
import { useSettings } from '@/composables/useSettings'
import { formatDayNumber, groupByMonth } from '@/lib/dates'
import { encodeFlightId } from '@/lib/flightId'
import type { Flight } from '@/types'

const { flights, loading, error, list, remove, sortFlights } = useFlights()
const { settings, fetch: fetchSettings } = useSettings()

const deleteTargetId = ref<string | null>(null)
const deleteOpen = ref(false)

onMounted(async () => {
  await fetchSettings()
  await list()
})

const sortedFlights = computed(() =>
  sortFlights([...flights.value], settings.value?.sort_direction ?? 'newest_first'),
)

const flightGroups = computed(() => groupByMonth(sortedFlights.value))

function rowZebraClass(flight: Flight): string {
  const index = sortedFlights.value.findIndex((item) => item.id === flight.id)
  return index % 2 === 1 ? 'bg-[var(--sheet-zebra-color)]' : ''
}

function askDelete(id: string): void {
  deleteTargetId.value = id
  deleteOpen.value = true
}

async function confirmDelete(): Promise<void> {
  if (!deleteTargetId.value) return
  await remove(deleteTargetId.value)
  deleteOpen.value = false
  deleteTargetId.value = null
}
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

    <LoadingState v-if="loading && !flights.length" />
    <ErrorBanner v-else-if="error" :message="error" @retry="list" />

    <div
      v-else-if="!sortedFlights.length"
      class="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500"
    >
      No flights yet. Add your first flight to get started.
    </div>

    <div v-else class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="min-w-full text-sm">
        <thead class="bg-[var(--sheet-header-color)] text-left text-slate-700">
          <tr>
            <th class="w-12 px-2 py-3 text-center font-medium sm:px-4">Day</th>
            <th class="px-4 py-3 font-medium">Pilot</th>
            <th class="px-4 py-3 font-medium">Glider</th>
            <th class="hidden px-4 py-3 font-medium sm:table-cell">Launch</th>
            <th class="px-4 py-3 font-medium">Time</th>
            <th class="hidden px-4 py-3 font-medium md:table-cell">Landings</th>
            <th class="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="group in flightGroups" :key="group.key">
            <tr class="border-t border-slate-200 bg-slate-100">
              <td colspan="7" class="px-4 py-2 text-sm font-semibold text-slate-700">
                {{ group.label }}
              </td>
            </tr>
            <tr
              v-for="flight in group.items"
              :key="flight.id"
              class="border-t border-slate-100"
              :class="rowZebraClass(flight)"
            >
              <td class="w-12 px-2 py-3 text-center font-medium tabular-nums text-slate-900 sm:px-4">
                {{ formatDayNumber(flight.date) }}
              </td>
              <td class="px-4 py-3">{{ flight.pilot || '—' }}</td>
              <td class="max-w-[8rem] truncate px-4 py-3 sm:max-w-none">
                {{ flight.glider }} {{ flight.registration }}
              </td>
              <td class="hidden px-4 py-3 sm:table-cell">{{ flight.launch_type || '—' }}</td>
              <td class="px-4 py-3 whitespace-nowrap">{{ flight.flight_time || '—' }}</td>
              <td class="hidden px-4 py-3 md:table-cell">{{ flight.landings }}</td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <RouterLink
                    :to="`/flights/${encodeFlightId(flight.id)}`"
                    class="text-sky-700 hover:underline"
                  >
                    Edit
                  </RouterLink>
                  <button
                    type="button"
                    class="text-red-600 hover:underline"
                    @click="askDelete(flight.id)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <ConfirmDialog
      :open="deleteOpen"
      title="Delete flight"
      message="This will permanently remove the flight row from your spreadsheet."
      confirm-label="Delete"
      @confirm="confirmDelete"
      @cancel="deleteOpen = false"
    />
  </div>
</template>
