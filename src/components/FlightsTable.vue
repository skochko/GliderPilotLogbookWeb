<script setup lang="ts">
import { computed, ref } from 'vue'
import FlightDetailDialog from '@/components/FlightDetailDialog.vue'
import FlightDurationCell from '@/components/FlightDurationCell.vue'
import FlightMediaDialog from '@/components/FlightMediaDialog.vue'
import FlightRowActions from '@/components/FlightRowActions.vue'
import IgcMapDialog from '@/components/IgcMapDialog.vue'
import IgcPickDialog from '@/components/IgcPickDialog.vue'
import RemarksDialog from '@/components/RemarksDialog.vue'
import { formatDayNumber, groupByMonth } from '@/lib/dates'
import {
  hasIgcAttachment,
  hasUserRemarks,
  igcAttachments,
  mediaListIcon,
  userRemarksText,
} from '@/lib/mediaTags'
import {
  formatRoleCompanionDisplay,
  pilotRoleLabel,
  pilotRoleStyles,
  pilotRolesFromFlight,
  roleCompanionName,
} from '@/lib/pilotRoles'
import { truncateText } from '@/lib/text'
import type { Flight, FlightMediaItem } from '@/types'

const props = withDefaults(
  defineProps<{
    flights: readonly Flight[]
    embedded?: boolean
  }>(),
  {
    embedded: false,
  },
)

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

const flightGroups = computed(() => groupByMonth([...props.flights]))

const tableWrapperClass = computed(() =>
  props.embedded
    ? 'overflow-x-auto'
    : 'overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm',
)

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
</script>

<template>
  <div>
    <div :class="tableWrapperClass">
      <table class="min-w-full text-sm">
        <thead class="bg-[var(--sheet-header-color)] text-left text-slate-700">
          <tr>
            <th class="w-10 px-2 py-2 text-center font-medium">Day</th>
            <th class="px-2 py-2 font-medium sm:px-3">Role</th>
            <th class="px-2 py-2 font-medium sm:px-3">Glider</th>
            <th class="hidden px-3 py-2 font-medium sm:table-cell">Launch</th>
            <th class="px-2 py-2 text-center font-medium sm:px-3">Time</th>
            <th class="hidden max-w-[12rem] px-3 py-2 font-medium lg:table-cell">Remarks</th>
            <th class="w-[6.5rem] px-2 py-2 text-left font-medium sm:w-28">Extras</th>
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
              class="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50/70"
              :class="rowClass(flight, index)"
              @click="openDetail(flight)"
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
                  @click.stop="openRemarks(flight)"
                >
                  {{ truncateText(userRemarksText(flight.remarks), 48) }}
                </button>
                <span v-else class="text-slate-300">—</span>
              </td>
              <td class="px-2 py-2 align-middle">
                <FlightRowActions
                  :flight="flight"
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
