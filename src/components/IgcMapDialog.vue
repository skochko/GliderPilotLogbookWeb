<script setup lang="ts">
import L from 'leaflet'
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import IgcAltitudeChart from '@/components/IgcAltitudeChart.vue'
import IgcTrackStats from '@/components/IgcTrackStats.vue'
import SpinnerIcon from '@/components/SpinnerIcon.vue'
import { fetchFlightIgcContent } from '@/api/flightMedia'
import { isApiError } from '@/api/errors'
import { useAuth } from '@/composables/useAuth'
import { useAltitudeReference, type AltitudeReference } from '@/composables/useAltitudeReference'
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
import { trailStartIndex } from '@/lib/trackPlayback'
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
const rangeStartIndex = ref(0)
const rangeEndIndex = ref(0)
const visualViewportHeight = ref<number | null>(null)
const visualViewportOffsetTop = ref(0)
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
  altitudeReference,
  saving: altitudeReferenceSaving,
  ensureLoaded: ensureAltitudeReferenceLoaded,
  setAltitudeReference,
} = useAltitudeReference()
const {
  mapLayer,
  saving: mapLayerSaving,
  ensureLoaded: ensureMapLayerLoaded,
  setMapLayer,
} = useMapLayerPreference()

let map: L.Map | null = null
let selectionMarker: L.CircleMarker | null = null
let progressLayer: L.LayerGroup | null = null
let rangeBoundaryLayer: L.LayerGroup | null = null
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
const altitudeOffsetM = computed(() => {
  if (altitudeReference.value !== 'qfe' || !track.value?.points.length) return 0
  return pointAltitude(track.value.points[rangeStartIndex.value]!) ?? 0
})

function selectTrackPoint(index: number | null): void {
  if (index === null || !track.value?.points.length) {
    selectedIndex.value = index
    return
  }

  const nextIndex = Math.max(rangeStartIndex.value, Math.min(index, rangeEndIndex.value))
  selectedIndex.value = nextIndex
}

function updateRangeStart(index: number): void {
  rangeStartIndex.value = Math.min(index, rangeEndIndex.value)
  if ((selectedIndex.value ?? 0) < rangeStartIndex.value)
    selectedIndex.value = rangeStartIndex.value
}

function updateRangeEnd(index: number): void {
  rangeEndIndex.value = Math.max(index, rangeStartIndex.value)
  if ((selectedIndex.value ?? 0) > rangeEndIndex.value) selectedIndex.value = rangeEndIndex.value
}

function destroyMap(): void {
  removeMapPointerListeners()
  inspectingTrack = false
  selectionMarker = null
  progressLayer = null
  rangeBoundaryLayer = null
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
  selectTrackPoint(index)
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
    selectTrackPoint(index)
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

function updateRangeBoundaryMarkers(): void {
  if (!map || !track.value?.points.length) return
  rangeBoundaryLayer?.remove()
  const start = track.value.points[rangeStartIndex.value]
  const end = track.value.points[rangeEndIndex.value]
  if (!start || !end) return
  rangeBoundaryLayer = L.layerGroup([
    L.circleMarker([start.lat, start.lng], {
      radius: 6,
      color: '#15803d',
      fillColor: '#22c55e',
      fillOpacity: 1,
      weight: 2,
    }).bindTooltip(`Range start ${formatIgcTime(start.time)}`, { direction: 'top' }),
    L.circleMarker([end.lat, end.lng], {
      radius: 6,
      color: '#b91c1c',
      fillColor: '#ef4444',
      fillOpacity: 1,
      weight: 2,
    }).bindTooltip(`Range end ${formatIgcTime(end.time)}`, { direction: 'top' }),
  ]).addTo(map)
}

function update2dTrackProgress(): void {
  if (!map || !track.value) return
  progressLayer?.remove()
  progressLayer = null

  const endIndex = rangeEndIndex.value
  const startIndex = Math.min(rangeStartIndex.value, endIndex)
  const currentIndex = Math.max(startIndex, Math.min(selectedIndex.value ?? startIndex, endIndex))
  const rangePoints = track.value.points.slice(startIndex, endIndex + 1)
  const trailStart = trailStartIndex(track.value.points, startIndex, currentIndex)
  const trailPoints = track.value.points.slice(trailStart, currentIndex + 1)
  if (rangePoints.length < 2) return
  const stats = getAltitudeStats(track.value.points)
  const layers: L.Layer[] = []
  if (stats) {
    for (const segment of buildColoredTrackSegments(rangePoints, stats)) {
      layers.push(
        L.polyline(segment.latlngs, {
          color: segment.color,
          weight: 1,
          opacity: 0.45,
          interactive: false,
        }),
      )
    }
    for (let index = 1; index < trailPoints.length; index += 1) {
      const segment = buildColoredTrackSegments(
        [trailPoints[index - 1]!, trailPoints[index]!],
        stats,
      )[0]
      if (!segment) continue
      layers.push(
        L.polyline(segment.latlngs, {
          color: segment.color,
          weight: 3,
          opacity: 0.12 + (index / (trailPoints.length - 1)) * 0.83,
          interactive: false,
        }),
      )
    }
  } else {
    layers.push(
      L.polyline(
        rangePoints.map((point) => [point.lat, point.lng] as [number, number]),
        { color: '#0369a1', weight: 1, opacity: 0.45, interactive: false },
      ),
    )
    for (let index = 1; index < trailPoints.length; index += 1)
      layers.push(
        L.polyline(
          [trailPoints[index - 1]!, trailPoints[index]!].map(
            (point) => [point.lat, point.lng] as [number, number],
          ),
          {
            color: '#0369a1',
            weight: 3,
            opacity: 0.12 + (index / (trailPoints.length - 1)) * 0.83,
            interactive: false,
          },
        ),
      )
  }
  progressLayer = L.layerGroup(layers).addTo(map)
}

function buildTooltip(point: IgcTrack['points'][number]): string {
  const altitude = pointAltitude(point)
  return [
    `<strong>${formatIgcTime(point.time)}</strong>`,
    `Alt: ${formatAltitude(altitude === null ? null : altitude - altitudeOffsetM.value, units.value)} (${altitudeReference.value.toUpperCase()})`,
    `Vario: ${formatVario(point.varioMs, units.value)}`,
    `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
  ].join('<br/>')
}

function onWindowResize(): void {
  updateVisualViewport()
  refreshMapLayout()
}

function updateVisualViewport(): void {
  visualViewportHeight.value = window.visualViewport?.height ?? window.innerHeight
  visualViewportOffsetTop.value = window.visualViewport?.offsetTop ?? 0
}

function onVisualViewportChange(): void {
  updateVisualViewport()
  void nextTick(() => map?.invalidateSize())
}

function renderTrack(content: string): void {
  if (!mapContainer.value) {
    return
  }

  const parsed = parseIgcTrack(content)
  track.value = parsed
  selectedIndex.value = parsed.points.length ? 0 : null
  rangeStartIndex.value = 0
  rangeEndIndex.value = Math.max(0, parsed.points.length - 1)

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

  L.layerGroup(layers).addTo(map)
  trackBounds = L.latLngBounds(
    parsed.points.map((point) => [point.lat, point.lng] as [number, number]),
  )
  refreshMapLayout()
  updateRangeBoundaryMarkers()
  update2dTrackProgress()
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
  update2dTrackProgress()
  updateSelectionMarker(index)
})

watch(rangeStartIndex, () => {
  update2dTrackProgress()
  updateRangeBoundaryMarkers()
})

watch(rangeEndIndex, () => {
  update2dTrackProgress()
  updateRangeBoundaryMarkers()
})

watch(units, () => {
  updateSelectionMarker(selectedIndex.value)
})

watch(altitudeOffsetM, () => {
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

async function selectAltitudeReference(next: AltitudeReference): Promise<void> {
  preferenceError.value = null
  try {
    await setAltitudeReference(next, !isDemo.value)
  } catch (err) {
    preferenceError.value = isApiError(err) ? err.message : 'Failed to save altitude reference'
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
      updateVisualViewport()
      if (!isDemo.value) {
        void ensureUnitsLoaded()
        void ensureAltitudeReferenceLoaded()
        void ensureMapLayerLoaded()
      }
      document.body.style.overflow = 'hidden'
      window.addEventListener('resize', onWindowResize)
      window.visualViewport?.addEventListener('resize', onVisualViewportChange)
      window.visualViewport?.addEventListener('scroll', onVisualViewportChange)
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('resize', onWindowResize)
      window.visualViewport?.removeEventListener('resize', onVisualViewportChange)
      window.visualViewport?.removeEventListener('scroll', onVisualViewportChange)
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
      rangeStartIndex.value = 0
      rangeEndIndex.value = 0
      preferenceError.value = null
      loading.value = false
    }
  },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('resize', onWindowResize)
  window.visualViewport?.removeEventListener('resize', onVisualViewportChange)
  window.visualViewport?.removeEventListener('scroll', onVisualViewportChange)
  destroyMap()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-x-0 z-[60] flex flex-col bg-white"
      :style="{
        top: `${visualViewportOffsetTop}px`,
        height: visualViewportHeight ? `${visualViewportHeight}px` : '100dvh',
      }"
    >
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
          <div class="flex shrink-0 items-center gap-1.5 text-xs font-medium">
            <label class="relative">
              <span class="sr-only">Measurement units</span>
              <select
                :value="units"
                class="appearance-none rounded-md border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-slate-800 shadow-sm disabled:opacity-50"
                :disabled="unitsSaving"
                @change="
                  selectUnits(($event.target as HTMLSelectElement).value as 'metric' | 'imperial')
                "
              >
                <option value="metric">SI</option>
                <option value="imperial">Imperial</option>
              </select>
              <span
                class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                >⌄</span
              >
            </label>
            <label class="relative">
              <span class="sr-only">Altitude reference</span>
              <select
                :value="altitudeReference"
                class="appearance-none rounded-md border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-slate-800 shadow-sm disabled:opacity-50"
                :disabled="altitudeReferenceSaving"
                @change="
                  selectAltitudeReference(
                    ($event.target as HTMLSelectElement).value as AltitudeReference,
                  )
                "
              >
                <option value="qnh">QNH</option>
                <option value="qfe">QFE</option>
              </select>
              <span
                class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                >⌄</span
              >
            </label>
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

          <IgcTrackStats
            v-if="track && track.points.length > 0 && !loading"
            :points="track.points"
            :units="units"
            :altitude-offset-m="altitudeOffsetM"
          />

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
              :start-index="rangeStartIndex"
              :end-index="rangeEndIndex"
              :altitude-offset-m="altitudeOffsetM"
              :map-layer="mapLayer"
              @update:selected-index="selectTrackPoint"
            />
          </div>

          <IgcAltitudeChart
            v-if="track && track.points.length > 0 && !loading"
            :points="track.points"
            :selected-index="selectedIndex"
            :start-index="rangeStartIndex"
            :end-index="rangeEndIndex"
            :altitude-offset-m="altitudeOffsetM"
            :units="units"
            class="relative z-[600] h-[clamp(230px,32dvh,340px)] shrink-0"
            @update:selected-index="selectTrackPoint"
            @update:start-index="updateRangeStart"
            @update:end-index="updateRangeEnd"
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
