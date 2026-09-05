<script setup lang="ts">
import L from 'leaflet'
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import IgcAltitudeChart from '@/components/IgcAltitudeChart.vue'
import SpinnerIcon from '@/components/SpinnerIcon.vue'
import { fetchFlightIgcContent } from '@/api/flightMedia'
import { isApiError } from '@/api/errors'
import { useAuth } from '@/composables/useAuth'
import { useMapLayerPreference, type MapLayerPreference } from '@/composables/useMapLayerPreference'
import { useMeasurementUnits } from '@/composables/useMeasurementUnits'
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

const Igc3DMap = defineAsyncComponent(() => import('@/components/Igc3DMap.vue'))

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
const preferenceError = ref<string | null>(null)
const viewMode = ref<'2d' | '3d'>('2d')
const layersOpen = ref(false)
const map3d = ref<{
  fitTrack: () => void
  toggleTilt: () => void
  zoomIn: () => void
  zoomOut: () => void
} | null>(null)
const {
  units,
  saving: unitsSaving,
  ensureLoaded: ensureUnitsLoaded,
  setUnits,
  setUnitsLocally,
} = useMeasurementUnits()
const { user } = useAuth()
const isDemo = computed(() => user.value?.is_demo ?? false)
const {
  mapLayer,
  saving: mapLayerSaving,
  ensureLoaded: ensureMapLayerLoaded,
  setMapLayer,
} = useMapLayerPreference()

let map: L.Map | null = null
let selectionMarker: L.CircleMarker | null = null
let progressLayer: L.LayerGroup | null = null
let trackBounds: L.LatLngBounds | null = null
let baseTileLayer: L.TileLayer | null = null
let inspectingTrack = false

const TRACK_HIT_RADIUS_PX = 24

const pointCount = computed(() => track.value?.points.length ?? 0)
const metadataLine = computed(() => (track.value ? metadataSummary(track.value.metadata) : ''))
const selectedPoint = computed(() => {
  if (selectedIndex.value === null || !track.value) {
    return null
  }
  return track.value.points[selectedIndex.value] ?? null
})

function destroyMap(): void {
  removeMapPointerListeners()
  inspectingTrack = false
  selectionMarker = null
  progressLayer = null
  baseTileLayer = null
  trackBounds = null
  if (map) {
    map.remove()
    map = null
  }
}

function applyMapLayer(): void {
  if (!map) return
  if (baseTileLayer) baseTileLayer.remove()

  baseTileLayer =
    mapLayer.value === 'satellite'
      ? L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri',
          },
        )
      : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: 'abc',
          attribution: '&copy; OpenStreetMap contributors',
        })

  baseTileLayer.addTo(map)
  baseTileLayer.bringToBack()
}

function closestPointIndex(clientX: number, clientY: number, maxDistance?: number): number | null {
  if (!map || !mapContainer.value || !track.value?.points.length) {
    return null
  }

  const rect = mapContainer.value.getBoundingClientRect()
  const pointer = L.point(clientX - rect.left, clientY - rect.top)
  let closestIndex: number | null = null
  let closestDistance = Number.POSITIVE_INFINITY

  track.value.points.forEach((point, index) => {
    const projected = map!.latLngToContainerPoint([point.lat, point.lng])
    const distance = pointer.distanceTo(projected)
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  })

  return maxDistance === undefined || closestDistance <= maxDistance ? closestIndex : null
}

function onMapPointerDown(event: PointerEvent): void {
  const index = closestPointIndex(event.clientX, event.clientY, TRACK_HIT_RADIUS_PX)
  if (index === null || !mapContainer.value) {
    return
  }

  inspectingTrack = true
  selectedIndex.value = index
  map?.dragging.disable()
  mapContainer.value.setPointerCapture(event.pointerId)
  event.preventDefault()
}

function onMapPointerMove(event: PointerEvent): void {
  const index = closestPointIndex(
    event.clientX,
    event.clientY,
    inspectingTrack ? undefined : TRACK_HIT_RADIUS_PX,
  )
  if (index !== null) {
    selectedIndex.value = index
  }
  if (inspectingTrack) {
    event.preventDefault()
  }
}

function onMapPointerEnd(event: PointerEvent): void {
  if (!inspectingTrack) {
    return
  }

  inspectingTrack = false
  map?.dragging.enable()
  if (mapContainer.value?.hasPointerCapture(event.pointerId)) {
    mapContainer.value.releasePointerCapture(event.pointerId)
  }
}

function addMapPointerListeners(): void {
  const container = mapContainer.value
  if (!container) {
    return
  }
  container.addEventListener('pointerdown', onMapPointerDown, { capture: true })
  container.addEventListener('pointermove', onMapPointerMove, { capture: true })
  container.addEventListener('pointerup', onMapPointerEnd, { capture: true })
  container.addEventListener('pointercancel', onMapPointerEnd, { capture: true })
}

function removeMapPointerListeners(): void {
  const container = mapContainer.value
  if (!container) {
    return
  }
  container.removeEventListener('pointerdown', onMapPointerDown, { capture: true })
  container.removeEventListener('pointermove', onMapPointerMove, { capture: true })
  container.removeEventListener('pointerup', onMapPointerEnd, { capture: true })
  container.removeEventListener('pointercancel', onMapPointerEnd, { capture: true })
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

function zoomIn(): void {
  if (viewMode.value === '3d') map3d.value?.zoomIn()
  else map?.zoomIn()
}

function zoomOut(): void {
  if (viewMode.value === '3d') map3d.value?.zoomOut()
  else map?.zoomOut()
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

function update2dTrackProgress(index: number | null): void {
  if (!map || !track.value) return
  progressLayer?.remove()
  progressLayer = null

  const endIndex = Math.max(0, index ?? 0)
  const playedPoints = track.value.points.slice(0, endIndex + 1)
  if (playedPoints.length < 2) return
  const stats = getAltitudeStats(track.value.points)
  const layers: L.Layer[] = []
  if (stats) {
    for (const segment of buildColoredTrackSegments(playedPoints, stats)) {
      layers.push(
        L.polyline(segment.latlngs, {
          color: segment.color,
          weight: 3,
          opacity: 0.95,
          interactive: false,
        }),
      )
    }
  } else {
    layers.push(
      L.polyline(
        playedPoints.map((point) => [point.lat, point.lng] as [number, number]),
        { color: '#0369a1', weight: 3, opacity: 0.95, interactive: false },
      ),
    )
  }
  progressLayer = L.layerGroup(layers).addTo(map)
}

function buildTooltip(point: IgcTrack['points'][number]): string {
  const altitude = pointAltitude(point)
  return [
    `<strong>${formatIgcTime(point.time)}</strong>`,
    `Alt: ${formatAltitude(altitude, units.value)}`,
    `Vario: ${formatVario(point.varioMs, units.value)}`,
    `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
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
    zoomControl: false,
    attributionControl: true,
    preferCanvas: true,
  })
  addMapPointerListeners()

  applyMapLayer()

  const layers: L.Layer[] = []
  const stats = getAltitudeStats(parsed.points)

  if (stats) {
    for (const segment of buildColoredTrackSegments(parsed.points, stats)) {
      layers.push(
        L.polyline(segment.latlngs, {
          color: segment.color,
          weight: 3,
          opacity: 0.25,
          interactive: false,
        }),
      )
    }
  } else {
    layers.push(
      L.polyline(
        parsed.points.map((point) => [point.lat, point.lng] as [number, number]),
        { color: '#0369a1', weight: 3, opacity: 0.25, interactive: false },
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

  L.layerGroup(layers).addTo(map)
  trackBounds = L.latLngBounds(
    parsed.points.map((point) => [point.lat, point.lng] as [number, number]),
  )
  refreshMapLayout()
  update2dTrackProgress(selectedIndex.value)
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
  update2dTrackProgress(index)
  updateSelectionMarker(index)
})

watch(units, () => {
  updateSelectionMarker(selectedIndex.value)
})

watch(mapLayer, applyMapLayer)

watch(viewMode, async (mode) => {
  if (mode === '2d') {
    await waitForVisibleMapContainer()
    refreshMapLayout()
  }
})

async function selectUnits(next: 'metric' | 'imperial'): Promise<void> {
  preferenceError.value = null
  if (isDemo.value) {
    setUnitsLocally(next)
    return
  }
  try {
    await setUnits(next)
  } catch (err) {
    preferenceError.value = isApiError(err) ? err.message : 'Failed to save measurement units'
  }
}

async function selectMapLayer(next: MapLayerPreference): Promise<void> {
  preferenceError.value = null
  try {
    await setMapLayer(next, !isDemo.value)
  } catch (err) {
    preferenceError.value = isApiError(err) ? err.message : 'Failed to save map style'
  }
}

function chooseMapLayer(next: MapLayerPreference): void {
  layersOpen.value = false
  void selectMapLayer(next)
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      if (!isDemo.value) {
        void ensureUnitsLoaded()
        void ensureMapLayerLoaded()
      }
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
      preferenceError.value = null
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
    <div v-if="open" class="fixed inset-0 z-[60] flex h-dvh flex-col bg-white">
      <div class="flex h-full min-h-0 w-full flex-col bg-white">
        <div
          class="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 pb-3 sm:px-6"
          style="padding-top: max(0.75rem, env(safe-area-inset-top))"
        >
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Go back"
            @click="emit('close')"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <div class="min-w-0 flex-1">
            <h2 class="text-base font-semibold text-slate-900 sm:text-lg">IGC track</h2>
            <p
              v-if="label"
              class="truncate text-xs text-slate-500 sm:text-sm"
              :title="filename ?? undefined"
            >
              {{ label }}
            </p>
            <p
              v-if="metadataLine"
              class="mt-0.5 truncate text-xs text-slate-500"
              :title="metadataLine"
            >
              {{ metadataLine }}
            </p>
          </div>
          <div class="flex shrink-0 rounded-md bg-slate-100 p-0.5 text-xs font-medium">
            <button
              v-for="option in [
                { value: 'metric', label: 'SI' },
                { value: 'imperial', label: 'Imperial' },
              ] as const"
              :key="option.value"
              type="button"
              class="rounded px-2.5 py-1.5 transition-colors disabled:opacity-50"
              :class="units === option.value ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-600'"
              :disabled="unitsSaving"
              @click="selectUnits(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
          <button
            type="button"
            class="px-1 text-2xl leading-none text-slate-600"
            aria-label="More options"
          >
            ⋮
          </button>
        </div>

        <div class="flex min-h-0 flex-1 flex-col">
          <ErrorBanner v-if="error" :message="error" :retry-busy="loading" @retry="loadTrack" />
          <ErrorBanner v-if="preferenceError" :message="preferenceError" />

          <div class="relative min-h-[180px] basis-0 flex-1">
            <div
              v-if="!loading && !error"
              class="absolute left-3 top-3 z-[500] flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium shadow-md"
            >
              <button
                v-for="option in [
                  { value: '2d', label: '2D' },
                  { value: '3d', label: '3D' },
                ] as const"
                :key="option.value"
                type="button"
                class="rounded-md px-3 py-1.5 transition-colors"
                :class="
                  viewMode === option.value
                    ? 'bg-sky-700 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                "
                @click="viewMode = option.value"
              >
                {{ option.label }}
              </button>
            </div>

            <div
              v-if="viewMode === '3d' && !loading && !error"
              class="absolute bottom-3 left-3 z-[500] overflow-hidden rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-md"
            >
              <button
                type="button"
                class="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-50"
                @click="map3d?.fitTrack()"
              >
                <span class="text-sm">⌗</span> Fit track
              </button>
            </div>

            <div
              v-if="!loading && !error"
              class="absolute right-3 top-16 z-[500] flex flex-col gap-1.5 text-slate-700"
            >
              <button
                type="button"
                class="flex size-8 items-center justify-center rounded-full bg-white text-sm shadow-md"
                :class="viewMode === '2d' ? 'invisible' : ''"
                aria-label="Change camera angle"
                @click="map3d?.toggleTilt()"
              >
                ◈
              </button>
              <div class="overflow-hidden rounded-lg bg-white shadow-md">
                <button
                  type="button"
                  class="block size-8 text-lg hover:bg-slate-50"
                  aria-label="Zoom in"
                  @click="zoomIn"
                >
                  +
                </button>
                <button
                  type="button"
                  class="block size-8 border-t border-slate-200 text-lg hover:bg-slate-50"
                  aria-label="Zoom out"
                  @click="zoomOut"
                >
                  −
                </button>
              </div>
            </div>

            <div
              v-if="!loading && !error"
              class="absolute right-3 top-3 z-[500] text-xs font-medium"
            >
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-md"
                @click="layersOpen = !layersOpen"
              >
                <span class="text-sm">▱</span> Layers <span class="text-slate-400">⌄</span>
              </button>
              <div
                v-if="layersOpen"
                class="mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white p-0.5 shadow-lg"
              >
                <button
                  v-for="option in [
                    { value: 'street', label: 'Map' },
                    { value: 'satellite', label: 'Satellite' },
                  ] as const"
                  :key="option.value"
                  type="button"
                  class="block w-full rounded-md px-3 py-1.5 text-left disabled:opacity-50"
                  :class="
                    mapLayer === option.value
                      ? 'bg-sky-700 text-white'
                      : 'text-slate-700 hover:bg-slate-50'
                  "
                  :disabled="mapLayerSaving"
                  @click="chooseMapLayer(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

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
              class="absolute inset-0 h-full w-full bg-slate-100"
              :class="viewMode === '2d' ? 'visible' : 'invisible'"
            />

            <Igc3DMap
              v-if="viewMode === '3d' && track && !loading && !error"
              ref="map3d"
              class="absolute inset-0 size-full overflow-hidden"
              :points="track.points"
              :selected-index="selectedIndex"
              :map-layer="mapLayer"
              @update:selected-index="selectedIndex = $event"
            />
          </div>

          <IgcAltitudeChart
            v-if="track && track.points.length > 0 && !loading"
            :points="track.points"
            :selected-index="selectedIndex"
            :units="units"
            class="relative z-[600] h-[clamp(200px,30dvh,320px)] shrink-0"
            @update:selected-index="selectedIndex = $event"
          />
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
