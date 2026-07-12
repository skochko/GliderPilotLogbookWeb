<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import IgcMapDialog from '@/components/IgcMapDialog.vue'
import FlightImageViewerDialog from '@/components/FlightImageViewerDialog.vue'
import { flightMediaContentUrl } from '@/api/flightMedia'
import { formatDisplayDate } from '@/lib/dates'
import { formatDurationProse } from '@/lib/duration'
import { encodeFlightId } from '@/lib/flightId'
import { dashboardChipBaseClass } from '@/lib/dashboardChips'
import {
  dashboardFieldLabelClass,
  dashboardPanelClass,
} from '@/lib/dashboardPanels'
import { launchTypeBadgeClass, launchTypeChipLabel } from '@/lib/launchTypes'
import { hasUserRemarks, userRemarksText } from '@/lib/mediaTags'
import { pilotRoleLabel, pilotRoleStyles, pilotRolesFromFlight, crewMembersFromFlight, flightSummaryBadgeBaseClass, flightSummaryMetaBadgeClass } from '@/lib/pilotRoles'
import type { Flight, FlightMediaItem } from '@/types'

const props = defineProps<{
  open: boolean
  flight: Flight | null
}>()

const emit = defineEmits<{ close: [] }>()

const igcMapOpen = ref(false)
const igcFilename = ref<string | null>(null)
const igcLabel = ref<string | null>(null)
const imageViewerOpen = ref(false)
const imageFilename = ref<string | null>(null)
const imageLabel = ref<string | null>(null)

function hasText(value: string | null | undefined): boolean {
  return Boolean((value ?? '').trim())
}

function closeDialog(): void {
  closeIgcMap()
  closeImageViewer()
  emit('close')
}

function openImageViewer(item: FlightMediaItem): void {
  imageFilename.value = item.filename
  imageLabel.value = item.label
  imageViewerOpen.value = true
}

function closeImageViewer(): void {
  imageViewerOpen.value = false
  imageFilename.value = null
  imageLabel.value = null
}

function openIgcMap(item: FlightMediaItem): void {
  igcFilename.value = item.filename
  igcLabel.value = item.label
  igcMapOpen.value = true
}

function closeIgcMap(): void {
  igcMapOpen.value = false
  igcFilename.value = null
  igcLabel.value = null
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      closeIgcMap()
      closeImageViewer()
    }
  },
)

function mediaDownloadUrl(item: FlightMediaItem): string | null {
  if (item.type === 'igc' || item.type === 'image') {
    return null
  }
  if (item.drive_url) {
    return item.drive_url
  }
  if (!props.flight) {
    return null
  }
  return flightMediaContentUrl(props.flight.id, item.filename)
}

function attachmentDisplayName(item: FlightMediaItem): string {
  return item.label || item.filename
}

function canOpenAttachment(item: FlightMediaItem): boolean {
  return item.type === 'igc' || item.type === 'image' || mediaDownloadUrl(item) !== null
}

function openAttachment(item: FlightMediaItem): void {
  if (item.type === 'igc') {
    openIgcMap(item)
    return
  }
  if (item.type === 'image') {
    openImageViewer(item)
    return
  }
  const url = mediaDownloadUrl(item)
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

function landingsLabel(count: number): string {
  return count === 1 ? '1 Landing' : `${count} Landings`
}

const flight = computed(() => props.flight)

const heroAirfield = computed(() => {
  if (!flight.value) {
    return ''
  }
  return (
    flight.value.departure_place?.trim() ||
    flight.value.arrival_place?.trim() ||
    ''
  )
})

const heroSubtitle = computed(() => {
  if (!flight.value) {
    return ''
  }
  const parts = [formatDisplayDate(flight.value.date)]
  if (heroAirfield.value) {
    parts.push(heroAirfield.value)
  }
  return parts.join(' • ')
})

const durationProse = computed(() =>
  flight.value ? formatDurationProse(flight.value.flight_time) : '—',
)

const heroAircraftTitle = computed(() => {
  if (!flight.value) {
    return 'Flight'
  }
  const glider = flight.value.glider?.trim() ?? ''
  const registration = flight.value.registration?.trim() ?? ''
  if (glider && registration) {
    return `${glider} ${registration}`
  }
  if (glider) {
    return glider
  }
  if (registration) {
    return registration
  }
  return 'Flight'
})

const summaryBadges = computed(() => {
  if (!flight.value) {
    return []
  }

  const badges: Array<{ key: string; label: string; className: string }> = []

  for (const role of pilotRolesFromFlight(flight.value)) {
    badges.push({
      key: `role-${role}`,
      label: pilotRoleLabel(role),
      className: `${flightSummaryBadgeBaseClass} ${pilotRoleStyles[role]}`,
    })
  }

  const launch = launchTypeChipLabel(flight.value.launch_type)
  if (launch) {
    badges.push({
      key: 'launch',
      label: launch,
      className: `${dashboardChipBaseClass} ${launchTypeBadgeClass(flight.value.launch_type)}`,
    })
  }

  if (flight.value.landings > 0) {
    badges.push({
      key: 'landings',
      label: landingsLabel(flight.value.landings),
      className: `${flightSummaryBadgeBaseClass} ${flightSummaryMetaBadgeClass}`,
    })
  }

  return badges
})

const crewMembers = computed(() =>
  flight.value ? crewMembersFromFlight(flight.value) : [],
)

const showRoute = computed(() => {
  if (!flight.value) {
    return false
  }
  return (
    hasText(flight.value.departure_place) ||
    hasText(flight.value.arrival_place) ||
    hasText(flight.value.launch_time) ||
    hasText(flight.value.landing_time)
  )
})

const remarks = computed(() => (flight.value ? userRemarksText(flight.value.remarks) : ''))
const mediaItems = computed(() => flight.value?.media ?? [])
</script>

<template>
  <Teleport to="body">
    <Transition name="flight-detail-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-[#1A2640]/40"
        aria-hidden="true"
        @click.self="closeDialog"
      />
    </Transition>

    <Transition name="flight-detail-slide">
      <div
        v-if="open && flight"
        class="fixed inset-x-0 bottom-0 z-50 flex justify-center p-0 sm:inset-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flight-detail-title"
      >
        <div
          class="flex max-h-[min(88dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-xl bg-white shadow-xl sm:rounded-xl"
        >
          <header class="shrink-0 border-b border-slate-200 px-4 pb-3 pt-3">
            <button
              type="button"
              class="float-right text-lg leading-none text-slate-400 transition hover:text-slate-600"
              aria-label="Close"
              @click="closeDialog"
            >
              ✕
            </button>

            <h2 id="flight-detail-title" class="clear-both pr-6 text-xl font-bold leading-tight text-slate-900">
              {{ heroAircraftTitle }}
            </h2>
            <p class="mt-0.5 text-xs text-slate-500">{{ heroSubtitle }}</p>
            <p class="mt-2 text-3xl font-bold leading-none text-sky-700">
              {{ durationProse }}
            </p>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto bg-slate-50">
            <div class="space-y-3 p-4">
              <div v-if="summaryBadges.length" class="flex flex-wrap gap-1.5">
              <span
                v-for="badge in summaryBadges"
                :key="badge.key"
                :class="badge.className"
              >
                {{ badge.label }}
              </span>
              </div>

              <article
                v-if="crewMembers.length"
                :class="[dashboardPanelClass, 'p-3']"
              >
                <p :class="[dashboardFieldLabelClass, 'mb-2']">Crew</p>
                <ul class="space-y-2">
                  <li
                    v-for="member in crewMembers"
                    :key="`${member.role}-${member.name}`"
                    class="flex items-center justify-between gap-3"
                  >
                    <span class="min-w-0 truncate text-sm font-semibold text-slate-900">
                      {{ member.name }}
                    </span>
                    <span
                      class="shrink-0"
                      :class="`${flightSummaryBadgeBaseClass} ${pilotRoleStyles[member.role]}`"
                    >
                      {{ pilotRoleLabel(member.role) }}
                    </span>
                  </li>
                </ul>
              </article>

            <article v-if="showRoute" :class="[dashboardPanelClass, 'p-3']">
              <p :class="[dashboardFieldLabelClass, 'mb-2']">Flight</p>
              <div class="space-y-2">
                <div class="flex justify-between gap-3 text-sm">
                  <div class="min-w-0">
                    <p class="text-xs text-slate-600">Departure</p>
                    <p class="truncate font-semibold text-slate-900">
                      {{ flight.departure_place?.trim() || '—' }}
                    </p>
                  </div>
                  <div class="shrink-0 tabular-nums text-slate-600">
                    {{ flight.launch_time?.trim() || '—' }}
                  </div>
                </div>

                <div class="text-center text-sm text-slate-400" aria-hidden="true">↓</div>

                <div class="flex justify-between gap-3 text-sm">
                  <div class="min-w-0">
                    <p class="text-xs text-slate-600">Arrival</p>
                    <p class="truncate font-semibold text-slate-900">
                      {{ flight.arrival_place?.trim() || '—' }}
                    </p>
                  </div>
                  <div class="shrink-0 tabular-nums text-slate-600">
                    {{ flight.landing_time?.trim() || '—' }}
                  </div>
                </div>
              </div>
            </article>

            <article v-if="hasUserRemarks(flight.remarks)" :class="[dashboardPanelClass, 'p-3']">
              <p :class="[dashboardFieldLabelClass, 'mb-2']">Notes</p>
              <p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {{ remarks }}
              </p>
            </article>

            <article v-if="mediaItems.length" :class="[dashboardPanelClass, 'p-3']">
              <p :class="[dashboardFieldLabelClass, 'mb-2']">
                {{ mediaItems.length === 1 ? 'Attachment' : 'Attachments' }}
              </p>
              <ul class="space-y-2">
                <li
                  v-for="item in mediaItems"
                  :key="`${item.type}:${item.filename}`"
                  class="flex items-center justify-between gap-3"
                >
                  <span class="min-w-0 truncate text-sm font-semibold text-slate-900">
                    {{ attachmentDisplayName(item) }}
                  </span>
                  <button
                    v-if="canOpenAttachment(item)"
                    type="button"
                    class="inline-flex shrink-0 rounded-md p-1 transition"
                    :class="
                      item.type === 'igc'
                        ? 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800'
                        : 'text-sky-600 hover:bg-sky-50 hover:text-sky-800'
                    "
                    :title="item.type === 'igc' ? 'View on map' : item.type === 'image' ? 'View image' : 'Download'"
                    :aria-label="
                      item.type === 'igc'
                        ? 'View IGC track on map'
                        : item.type === 'image'
                          ? 'View image'
                          : 'Download attachment'
                    "
                    @click="openAttachment(item)"
                  >
                    <svg
                      v-if="item.type === 'igc'"
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
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                    <svg
                      v-else-if="item.type === 'image'"
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
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21Z"
                      />
                    </svg>
                    <svg
                      v-else
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
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12M12 16.5V3"
                      />
                    </svg>
                  </button>
                </li>
              </ul>
            </article>
            </div>
          </div>

          <div class="shrink-0 border-t border-slate-200 px-4 py-3">
            <RouterLink
              :to="`/flights/${encodeFlightId(flight.id)}`"
              class="flex w-full items-center justify-center rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
              @click="closeDialog"
            >
              Edit flight
            </RouterLink>
          </div>
        </div>
      </div>
    </Transition>

    <IgcMapDialog
      :open="igcMapOpen"
      :flight-id="flight?.id ?? null"
      :filename="igcFilename"
      :label="igcLabel"
      @close="closeIgcMap"
    />

    <FlightImageViewerDialog
      :open="imageViewerOpen"
      :flight-id="flight?.id ?? null"
      :filename="imageFilename"
      :label="imageLabel"
      @close="closeImageViewer"
    />
  </Teleport>
</template>

<style scoped>
.flight-detail-fade-enter-active,
.flight-detail-fade-leave-active {
  transition: opacity 0.22s ease;
}

.flight-detail-fade-enter-from,
.flight-detail-fade-leave-to {
  opacity: 0;
}

.flight-detail-slide-enter-active,
.flight-detail-slide-leave-active {
  transition:
    transform 0.28s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.22s ease;
}

.flight-detail-slide-enter-from,
.flight-detail-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (min-width: 640px) {
  .flight-detail-slide-enter-from,
  .flight-detail-slide-leave-to {
    transform: translateY(24px) scale(0.98);
  }
}
</style>
