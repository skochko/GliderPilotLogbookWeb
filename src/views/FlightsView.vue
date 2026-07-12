<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import FlightMediaDialog from '@/components/FlightMediaDialog.vue'
import IgcMapDialog from '@/components/IgcMapDialog.vue'
import LoadingState from '@/components/LoadingState.vue'
import RemarksDialog from '@/components/RemarksDialog.vue'
import SpinnerIcon from '@/components/SpinnerIcon.vue'
import { useFlights } from '@/composables/useFlights'
import { useDisplaySettings } from '@/composables/useDisplaySettings'
import { formatDayNumber, groupByMonth } from '@/lib/dates'
import { formatDurationDisplay } from '@/lib/duration'
import { encodeFlightId } from '@/lib/flightId'
import { pilotRoleLabel, pilotRoleStyles, pilotRolesFromFlight, formatRoleCompanionDisplay, roleCompanionName } from '@/lib/pilotRoles'
import {
  firstIgcAttachment,
  hasIgcAttachment,
  hasOtherMediaAttachments,
} from '@/lib/mediaTags'
import { hasRemarks, truncateText } from '@/lib/text'
import type { Flight } from '@/types'

const {
  flights,
  loading,
  loadingMore,
  hasMore,
  listInitialized,
  mutating,
  error,
  list,
  loadMore,
  remove,
} = useFlights()
const { displaySettings, ensureLoaded } = useDisplaySettings()

const deleteTargetId = ref<string | null>(null)
const deleteOpen = ref(false)
const remarksOpen = ref(false)
const remarksText = ref('')
const remarksFlightId = ref<string | null>(null)
const mediaOpen = ref(false)
const mediaFlightId = ref<string | null>(null)
const igcMapOpen = ref(false)
const igcFlightId = ref<string | null>(null)
const igcFilename = ref<string | null>(null)
const igcLabel = ref<string | null>(null)
const loadMoreSentinel = ref<HTMLElement | null>(null)

let loadMoreObserver: IntersectionObserver | null = null

const flightGroups = computed(() => groupByMonth(flights.value))

async function reloadFlights(): Promise<void> {
  await list(displaySettings.value?.sort_direction)
}

async function handleLoadMore(): Promise<void> {
  if (!hasMore.value || loadingMore.value) {
    return
  }
  await loadMore()
}

function rowClass(flight: Flight, index: number): string {
  const classes: string[] = []
  if (index % 2 === 1) {
    classes.push('bg-[var(--sheet-zebra-color)]')
  }
  if (hasIgcAttachment(flight)) {
    classes.push('border-l-2 border-l-emerald-400')
  } else if (hasOtherMediaAttachments(flight)) {
    classes.push('border-l-2 border-l-sky-400')
  } else if (hasRemarks(flight.remarks)) {
    classes.push('border-l-2 border-l-amber-400')
  }
  return classes.join(' ')
}

function openMedia(flight: Flight): void {
  mediaFlightId.value = flight.id
  mediaOpen.value = true
}

function openIgcMap(flight: Flight): void {
  const igc = firstIgcAttachment(flight)
  if (!igc) {
    return
  }
  igcFlightId.value = flight.id
  igcFilename.value = igc.filename
  igcLabel.value = igc.label
  igcMapOpen.value = true
}

function closeIgcMap(): void {
  igcMapOpen.value = false
  igcFlightId.value = null
  igcFilename.value = null
  igcLabel.value = null
}

function openRemarks(flight: Flight): void {
  remarksText.value = flight.remarks.trim()
  remarksFlightId.value = flight.id
  remarksOpen.value = true
}

function askDelete(id: string): void {
  deleteTargetId.value = id
  deleteOpen.value = true
}

async function confirmDelete(): Promise<void> {
  if (!deleteTargetId.value || mutating.value) return
  const ok = await remove(deleteTargetId.value)
  if (ok) {
    deleteOpen.value = false
    deleteTargetId.value = null
  }
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
  await ensureLoaded()
  await reloadFlights()
  bindLoadMoreObserver()
})

onUnmounted(() => {
  loadMoreObserver?.disconnect()
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

    <LoadingState v-if="!listInitialized" />
    <ErrorBanner v-else-if="error && !flights.length" :message="error" :retry-busy="loading" @retry="reloadFlights" />

    <div
      v-else-if="listInitialized && !flights.length"
      class="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500"
    >
      No flights yet. Add your first flight to get started.
    </div>

    <div v-else-if="listInitialized" class="space-y-3">
      <ErrorBanner v-if="error && flights.length" :message="error" :retry-busy="loadingMore" @retry="handleLoadMore" />

      <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table class="min-w-full text-sm">
          <thead class="bg-[var(--sheet-header-color)] text-left text-slate-700">
            <tr>
              <th class="w-12 px-2 py-2 text-center font-medium sm:px-4">Day</th>
              <th class="px-3 py-2 font-medium">Role</th>
              <th class="px-4 py-2 font-medium">Glider</th>
              <th class="hidden px-4 py-2 font-medium sm:table-cell">Launch</th>
              <th class="px-4 py-2 font-medium">Time</th>
              <th class="hidden max-w-[12rem] px-4 py-2 font-medium lg:table-cell">Remarks</th>
              <th class="w-20 px-2 py-2 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="group in flightGroups" :key="group.key">
              <tr class="border-t border-slate-200 bg-slate-100">
                <td colspan="7" class="px-4 py-1.5 text-sm font-semibold text-slate-700">
                  {{ group.label }}
                </td>
              </tr>
              <tr
                v-for="(flight, index) in group.items"
                :key="flight.id"
                class="border-t border-slate-100"
                :class="rowClass(flight, index)"
              >
                <td class="relative w-12 px-2 py-2 text-center font-medium tabular-nums text-slate-900 sm:px-4">
                  <button
                    v-if="hasRemarks(flight.remarks)"
                    type="button"
                    class="absolute left-0 top-1/2 -translate-y-1/2 rounded p-1 text-amber-600 hover:bg-amber-50 lg:hidden"
                    aria-label="View remarks"
                    @click.stop="openRemarks(flight)"
                  >
                    <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M4 4h16a1 1 0 011 1v11a1 1 0 01-1 1H8l-4 3V5a1 1 0 011-1z"
                      />
                    </svg>
                  </button>
                  {{ formatDayNumber(flight.date) }}
                </td>
                <td class="px-3 py-2">
                  <div
                    v-if="pilotRolesFromFlight(flight).length"
                    class="inline-flex flex-nowrap items-center gap-1"
                  >
                    <span
                      v-for="role in pilotRolesFromFlight(flight)"
                      :key="role"
                      class="inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset"
                      :class="pilotRoleStyles[role]"
                    >
                      {{ pilotRoleLabel(role) }}
                    </span>
                  </div>
                  <span v-else class="text-slate-300">—</span>
                  <p
                    v-if="roleCompanionName(pilotRolesFromFlight(flight), flight)"
                    class="mt-0.5 truncate text-xs text-slate-500"
                    :title="roleCompanionName(pilotRolesFromFlight(flight), flight)"
                  >
                    {{ formatRoleCompanionDisplay(pilotRolesFromFlight(flight), flight) }}
                  </p>
                </td>
                <td class="max-w-[8rem] px-4 py-2 sm:max-w-none">
                  <p class="truncate text-slate-900">{{ flight.glider }}</p>
                  <p v-if="flight.registration?.trim()" class="mt-0.5 truncate text-xs text-slate-500">
                    {{ flight.registration.trim() }}
                  </p>
                </td>
                <td class="hidden px-4 py-2 sm:table-cell">{{ flight.launch_type || '—' }}</td>
                <td class="px-4 py-2 whitespace-nowrap">{{ formatDurationDisplay(flight.flight_time) }}</td>
                <td class="hidden max-w-[12rem] px-4 py-2 lg:table-cell">
                  <button
                    v-if="hasRemarks(flight.remarks)"
                    type="button"
                    class="block max-w-full truncate text-left text-sm text-amber-900 hover:text-amber-700 hover:underline"
                    :title="flight.remarks.trim()"
                    @click="openRemarks(flight)"
                  >
                    {{ truncateText(flight.remarks, 48) }}
                  </button>
                  <span v-else class="text-slate-300">—</span>
                </td>
                <td class="px-2 py-2">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      v-if="hasIgcAttachment(flight)"
                      type="button"
                      class="inline-flex rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-800"
                      title="View IGC track"
                      aria-label="View IGC track"
                      @click.stop="openIgcMap(flight)"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="hasOtherMediaAttachments(flight)"
                      type="button"
                      class="inline-flex rounded-md p-1.5 text-sky-600 transition hover:bg-sky-50 hover:text-sky-800"
                      title="View media"
                      aria-label="View media"
                      @click.stop="openMedia(flight)"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="m15 10 4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <RouterLink
                      :to="`/flights/${encodeFlightId(flight.id)}`"
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
                    <button
                      type="button"
                      class="inline-flex rounded-md p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="mutating"
                      title="Delete"
                      aria-label="Delete flight"
                      @click="askDelete(flight.id)"
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
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div ref="loadMoreSentinel" class="h-px" aria-hidden="true" />

      <div v-if="hasMore || loadingMore" class="rounded-lg border border-slate-200 bg-white px-4 py-4 text-center shadow-sm">
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

    <ConfirmDialog
      :open="deleteOpen"
      title="Delete flight"
      message="This will permanently remove the flight row from your spreadsheet."
      confirm-label="Delete"
      :busy="mutating"
      @confirm="confirmDelete"
      @cancel="deleteOpen = false"
    />

    <RemarksDialog
      :open="remarksOpen"
      :text="remarksText"
      :flight-id="remarksFlightId"
      @close="remarksOpen = false"
    />

    <FlightMediaDialog
      :open="mediaOpen"
      :flight-id="mediaFlightId"
      @close="mediaOpen = false"
    />

    <IgcMapDialog
      :open="igcMapOpen"
      :flight-id="igcFlightId"
      :filename="igcFilename"
      :label="igcLabel"
      @close="closeIgcMap"
    />
  </div>
</template>
