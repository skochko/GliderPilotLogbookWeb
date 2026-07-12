<script setup lang="ts">
import L from 'leaflet'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import IgcAltitudeChart from '@/components/IgcAltitudeChart.vue'
import SpinnerIcon from '@/components/SpinnerIcon.vue'
import { fetchFlightIgcContent } from '@/api/flightMedia'
import { isApiError } from '@/api/errors'
import {
  buildColoredTrackSegments,
  formatAltitude,
  formatIgcTime,
  formatVario,
  getAltitudeStats,
  metadataSummary,
  parseIgcTrack,
  pointAltitude,
  type IgcTrack,
} from '@/lib/igc'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{
  open: boolean
  flightId: string | null
  filename: string | null
  label: string | null
}>()

const emit = defineEmits<{
  close: []
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const track = ref<IgcTrack | null>(null)
const selectedIndex = ref<number | null>(null)
const mapContainer = ref<HTMLElement | null>(null)

let map: L.Map | null = null
let trackLayer: L.LayerGroup | null = null
let selectionMarker: L.CircleMarker | null = null
let trackBounds: L.LatLngBounds | null = null

const pointCount = computed(() => track.value?.points.length ?? 0)
const metadataLine = computed(() => (track.value ? metadataSummary(track.value.metadata) : ''))
const selectedPoint = computed(() => {
  if (selectedIndex.value === null || !track.value) {
    return null
  }
  return track.value.points[selectedIndex.value] ?? null
})

function destroyMap(): void {
  selectionMarker = null
  trackLayer = null
  trackBounds = null
  if (map) {
    map.remove()
    map = null
  }
}

function refreshMapLayout(): void {
  if (!map) {
    return
  }

  map.invalidateSize()
  if (trackBounds) {
    map.fitBounds(trackBounds, { padding: [24, 24] })
  }
}

function updateSelectionMarker(index: number | null): void {
  if (!map || !track.value) {
    return
  }

  if (selectionMarker) {
    selectionMarker.remove()
    selectionMarker = null
  }

  if (index === null) {
    return
  }

  const point = track.value.points[index]
  if (!point) {
    return
  }

  selectionMarker = L.circleMarker([point.lat, point.lng], {
    radius: 7,
    color: '#b45309',
    fillColor: '#fbbf24',
    fillOpacity: 1,
    weight: 2,
  })
    .bindTooltip(buildTooltip(point), { direction: 'top', offset: [0, -8] })
    .addTo(map)
    .openTooltip()
}

function buildTooltip(point: IgcTrack['points'][number]): string {
  const altitude = pointAltitude(point)
  return [
    `<strong>${formatIgcTime(point.time)}</strong>`,
    `Alt: ${formatAltitude(altitude)}`,
    `Vario: ${formatVario(point.varioMs)}`,
  ].join('<br/>')
}

function onWindowResize(): void {
  refreshMapLayout()
}

function renderTrack(content: string): void {
  if (!mapContainer.value) {
    return
  }

  const parsed = parseIgcTrack(content)
  track.value = parsed
  selectedIndex.value = null

  if (parsed.points.length === 0) {
    error.value = 'No GPS track points found in this IGC file.'
    return
  }

  destroyMap()
  map = L.map(mapContainer.value, {
    zoomControl: true,
    attributionControl: true,
    preferCanvas: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    subdomains: 'abc',
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  const layers: L.Layer[] = []
  const stats = getAltitudeStats(parsed.points)

  if (stats) {
    for (const segment of buildColoredTrackSegments(parsed.points, stats)) {
      layers.push(
        L.polyline(segment.latlngs, {
          color: segment.color,
          weight: 3,
          opacity: 0.9,
        }),
      )
    }
  } else {
    layers.push(
      L.polyline(
        parsed.points.map((point) => [point.lat, point.lng] as [number, number]),
        { color: '#0369a1', weight: 3, opacity: 0.9 },
      ),
    )
  }

  const start = parsed.points[0]!
  const end = parsed.points[parsed.points.length - 1]!
  layers.push(
    L.circleMarker([start.lat, start.lng], {
      radius: 6,
      color: '#15803d',
      fillColor: '#22c55e',
      fillOpacity: 1,
      weight: 2,
    }).bindTooltip(`Start ${formatIgcTime(start.time)}`, { direction: 'top' }),
  )
  layers.push(
    L.circleMarker([end.lat, end.lng], {
      radius: 6,
      color: '#b91c1c',
      fillColor: '#ef4444',
      fillOpacity: 1,
      weight: 2,
    }).bindTooltip(`End ${formatIgcTime(end.time)}`, { direction: 'top' }),
  )

  trackLayer = L.layerGroup(layers).addTo(map)
  trackBounds = L.latLngBounds(parsed.points.map((point) => [point.lat, point.lng] as [number, number]))
  refreshMapLayout()
}

async function waitForVisibleMapContainer(): Promise<void> {
  await nextTick()
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

async function loadTrack(): Promise<void> {
  if (!props.flightId || !props.filename) {
    return
  }

  loading.value = true
  error.value = null
  track.value = null
  selectedIndex.value = null
  destroyMap()

  try {
    const content = await fetchFlightIgcContent(props.flightId, props.filename)
    loading.value = false
    await waitForVisibleMapContainer()
    renderTrack(content)
    await waitForVisibleMapContainer()
    refreshMapLayout()
  } catch (err) {
    error.value = isApiError(err) ? err.message : 'Failed to load IGC track'
    loading.value = false
  }
}

watch(selectedIndex, (index) => {
  updateSelectionMarker(index)
})

watch(
  () => props.open,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('resize', onWindowResize)
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('resize', onWindowResize)
    }
  },
)

watch(
  () => [props.open, props.flightId, props.filename] as const,
  ([open, flightId, filename]) => {
    if (open && flightId && filename) {
      void loadTrack()
    } else if (!open) {
      destroyMap()
      error.value = null
      track.value = null
      selectedIndex.value = null
      loading.value = false
    }
  },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('resize', onWindowResize)
  destroyMap()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-x-0 bottom-0 top-14 z-[60] flex flex-col bg-white sm:inset-0 sm:top-0 sm:items-center sm:justify-center sm:bg-slate-900/40 sm:p-4"
      @click.self="emit('close')"
    >
      <div
        class="flex h-full w-full flex-col sm:h-[min(92vh,920px)] sm:max-w-5xl sm:rounded-lg sm:border sm:border-slate-200 sm:bg-white sm:shadow-xl"
        @click.stop
      >
        <div
          class="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4"
        >
          <div class="min-w-0">
            <h2 class="text-base font-semibold text-slate-900 sm:text-lg">IGC track</h2>
            <p v-if="label" class="truncate text-xs text-slate-500 sm:text-sm" :title="filename ?? undefined">
              {{ label }}
            </p>
            <p v-if="metadataLine" class="mt-0.5 truncate text-xs text-slate-500" :title="metadataLine">
              {{ metadataLine }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
            @click="emit('close')"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-2 sm:gap-3 sm:px-5 sm:py-4">
          <ErrorBanner v-if="error" :message="error" :retry-busy="loading" @retry="loadTrack" />

          <div
            v-if="selectedPoint"
            class="flex shrink-0 flex-wrap gap-x-4 gap-y-1 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:text-sm"
          >
            <span><span class="text-slate-400">Time</span> {{ formatIgcTime(selectedPoint.time) }}</span>
            <span><span class="text-slate-400">Alt</span> {{ formatAltitude(pointAltitude(selectedPoint)) }}</span>
            <span><span class="text-slate-400">Vario</span> {{ formatVario(selectedPoint.varioMs) }}</span>
          </div>

          <div class="relative min-h-0 flex-1">
            <div
              v-if="loading"
              class="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white text-sm text-slate-500 sm:rounded-md"
            >
              <SpinnerIcon class="h-4 w-4" />
              Loading track…
            </div>

            <div
              v-show="!error"
              ref="mapContainer"
              class="h-full w-full bg-slate-100 sm:rounded-md sm:border sm:border-slate-200"
            />
          </div>

          <IgcAltitudeChart
            v-if="track && track.points.length > 0 && !loading"
            :points="track.points"
            :selected-index="selectedIndex"
            class="shrink-0 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-0 sm:pb-0"
            @update:selected-index="selectedIndex = $event"
          />

          <p v-if="pointCount > 0 && !loading" class="hidden shrink-0 text-xs text-slate-500 sm:block">
            {{ pointCount }} GPS points · track colour = altitude · hover chart to inspect
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
}

@media (min-width: 640px) {
  :deep(.leaflet-container) {
    border-radius: 0.375rem;
  }
}
</style>
