<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import FlightDetailDialog from '@/components/FlightDetailDialog.vue'
import FlightDurationCell from '@/components/FlightDurationCell.vue'
import FlightMediaDialog from '@/components/FlightMediaDialog.vue'
import FlightRowActions from '@/components/FlightRowActions.vue'
import IgcMapDialog from '@/components/IgcMapDialog.vue'
import IgcPickDialog from '@/components/IgcPickDialog.vue'
import LoadingState from '@/components/LoadingState.vue'
import RemarksDialog from '@/components/RemarksDialog.vue'
import SpinnerIcon from '@/components/SpinnerIcon.vue'
import { useFlights } from '@/composables/useFlights'
import { useDisplaySettings } from '@/composables/useDisplaySettings'
import { groupByMonth, formatDayNumber } from '@/lib/dates'
import { pilotRoleLabel, pilotRoleStyles, pilotRolesFromFlight, formatRoleCompanionDisplay, roleCompanionName } from '@/lib/pilotRoles'
import {
  hasIgcAttachment,
  hasUserRemarks,
  igcAttachments,
  mediaListIcon,
  userRemarksText,
} from '@/lib/mediaTags'
import { truncateText } from '@/lib/text'
import type { Flight, FlightMediaItem } from '@/types'

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

const remarksOpen = ref(false)
const remarksText = ref('')
const remarksFlightId = ref<string | null>(null)
const detailOpen = ref(false)
const detailFlight = ref<Flight | null>(null)
const mediaOpen = ref(false)
const mediaFlightId = ref<string | null>(null)
const igcMapOpen = ref(false)
const igcFlightId = ref<string | null>(null)
const igcFilename = ref<string | null>(null)
const igcLabel = ref<string | null>(null)
const igcPickOpen = ref(false)
const igcPickFlightId = ref<string | null>(null)
const igcPickItems = ref<FlightMediaItem[]>([])
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
  } else if (mediaListIcon(flight)) {
    classes.push('border-l-2 border-l-sky-400')
  } else if (hasUserRemarks(flight.remarks)) {
    classes.push('border-l-2 border-l-amber-400')
  }
  return classes.join(' ')
}

function openMedia(flight: Flight): void {
  mediaFlightId.value = flight.id
  mediaOpen.value = true
}

function openIgcMapForItem(flightId: string, item: FlightMediaItem): void {
  igcFlightId.value = flightId
  igcFilename.value = item.filename
  igcLabel.value = item.label
  igcMapOpen.value = true
}

function openIgcPicker(flight: Flight): void {
  const igcs = igcAttachments(flight)
  if (igcs.length === 0) {
    return
  }
  if (igcs.length === 1) {
    openIgcMapForItem(flight.id, igcs[0]!)
    return
  }
  igcPickFlightId.value = flight.id
  igcPickItems.value = igcs
  igcPickOpen.value = true
}

function openIgcMap(flight: Flight): void {
  openIgcPicker(flight)
}

function onIgcPicked(item: FlightMediaItem): void {
  if (!igcPickFlightId.value) {
    return
  }
  openIgcMapForItem(igcPickFlightId.value, item)
  closeIgcPick()
}

function closeIgcPick(): void {
  igcPickOpen.value = false
  igcPickItems.value = []
  igcPickFlightId.value = null
}

function closeIgcMap(): void {
  igcMapOpen.value = false
  igcFlightId.value = null
  igcFilename.value = null
  igcLabel.value = null
}

function openDetail(flight: Flight): void {
  detailFlight.value = flight
  detailOpen.value = true
}

function openRemarks(flight: Flight): void {
  remarksText.value = userRemarksText(flight.remarks)
  remarksFlightId.value = flight.id
  remarksOpen.value = true
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
              <th class="w-10 px-2 py-2 text-center font-medium">Day</th>
              <th class="px-2 py-2 font-medium sm:px-3">Role</th>
              <th class="px-2 py-2 font-medium sm:px-3">Glider</th>
              <th class="hidden px-3 py-2 font-medium sm:table-cell">Launch</th>
              <th class="px-2 py-2 text-center font-medium sm:px-3">Time</th>
              <th class="hidden max-w-[12rem] px-3 py-2 font-medium lg:table-cell">Remarks</th>
              <th class="px-1 py-2 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="group in flightGroups" :key="group.key">
              <tr class="border-t border-slate-200 bg-slate-100">
                <td colspan="7" class="px-2 py-1 text-sm font-semibold text-slate-700 sm:px-4 sm:py-1.5">
                  {{ group.label }}
                </td>
              </tr>
              <tr
                v-for="(flight, index) in group.items"
                :key="flight.id"
                class="border-t border-slate-100"
                :class="rowClass(flight, index)"
              >
                <td class="px-2 py-2 text-center font-medium tabular-nums text-slate-900">
                  {{ formatDayNumber(flight.date) }}
                </td>
                <td class="max-w-[7.5rem] px-2 py-2 sm:max-w-none sm:px-3">
                  <div
                    v-if="pilotRolesFromFlight(flight).length"
                    class="inline-flex max-w-full flex-nowrap items-center gap-0.5"
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
                <td class="max-w-[7rem] px-2 py-2 sm:max-w-none sm:px-3">
                  <p class="truncate text-slate-900">{{ flight.glider }}</p>
                  <p v-if="flight.registration?.trim()" class="mt-0.5 truncate text-xs text-slate-500">
                    {{ flight.registration.trim() }}
                  </p>
                </td>
                <td class="hidden px-3 py-2 sm:table-cell">{{ flight.launch_type || '—' }}</td>
                <td class="px-2 py-2 text-center tabular-nums sm:px-3">
                  <FlightDurationCell :value="flight.flight_time" />
                </td>
                <td class="hidden max-w-[12rem] px-3 py-2 lg:table-cell">
                  <button
                    v-if="hasUserRemarks(flight.remarks)"
                    type="button"
                    class="block max-w-full truncate text-left text-sm text-amber-900 hover:text-amber-700 hover:underline"
                    :title="userRemarksText(flight.remarks)"
                    @click="openRemarks(flight)"
                  >
                    {{ truncateText(userRemarksText(flight.remarks), 48) }}
                  </button>
                  <span v-else class="text-slate-300">—</span>
                </td>
                <td class="px-0.5 py-2 sm:px-1">
                  <FlightRowActions
                    :flight="flight"
                    @open-view="openDetail(flight)"
                    @open-igc="openIgcMap(flight)"
                    @open-remarks="openRemarks(flight)"
                    @open-media="openMedia(flight)"
                  />
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

    <FlightDetailDialog
      :open="detailOpen"
      :flight="detailFlight"
      @close="detailOpen = false"
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

    <IgcPickDialog
      :open="igcPickOpen"
      :items="igcPickItems"
      @close="closeIgcPick"
      @select="onIgcPicked"
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
