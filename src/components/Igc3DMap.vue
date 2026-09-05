<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArcType,
  BoundingSphere,
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  createWorldTerrainAsync,
  Entity,
  GeometryInstance,
  HeadingPitchRange,
  ImageryLayer,
  Ion,
  Math as CesiumMath,
  Matrix4,
  PolylineColorAppearance,
  PolylineGeometry,
  Primitive,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  SceneTransforms,
  sampleTerrainMostDetailed,
  UrlTemplateImageryProvider,
  Viewer,
} from 'cesium'
import type { TerrainProvider } from 'cesium'
import type { MapLayerPreference } from '@/composables/useMapLayerPreference'
import { useMeasurementUnits } from '@/composables/useMeasurementUnits'
import { formatAltitude, formatIgcTime, formatVario, pointAltitude, type IgcPoint } from '@/lib/igc'
import 'cesium/Build/Cesium/Widgets/widgets.css'

const props = defineProps<{
  points: readonly IgcPoint[]
  selectedIndex: number | null
  mapLayer: MapLayerPreference
}>()
const emit = defineEmits<{ 'update:selectedIndex': [number] }>()
const { units } = useMeasurementUnits()
const container = ref<HTMLElement | null>(null)
const sceneReady = ref(false)
let viewer: Viewer | null = null
let trackEntity: Entity | null = null
let selectedEntity: Entity | null = null
let playedWallEntity: Entity | null = null
let playedTrackPrimitive: Primitive | null = null
let trackPositions: Cartesian3[] = []
let trackGroundHeights: number[] = []
let progressFrame: number | null = null
let inputHandler: ScreenSpaceEventHandler | null = null
let resizeObserver: ResizeObserver | null = null
let removePostRenderListener: (() => void) | null = null
let loadingFallbackTimer: ReturnType<typeof setTimeout> | null = null
let tilted = true

const altitude = (point: IgcPoint) => pointAltitude(point) ?? 0
function airbornePositions(
  groundHeights: readonly number[],
  normalizeToTerrain: boolean,
): Cartesian3[] {
  const lastIndex = props.points.length - 1
  const startCorrection = normalizeToTerrain
    ? (groundHeights[0] ?? 0) - altitude(props.points[0]!)
    : 0
  const endCorrection = normalizeToTerrain
    ? (groundHeights[lastIndex] ?? 0) - altitude(props.points[lastIndex]!)
    : 0

  return props.points.map((point, index) => {
    const ratio = index / Math.max(lastIndex, 1)
    const correction = startCorrection + (endCorrection - startCorrection) * ratio
    const groundHeight = groundHeights[index] ?? 0
    const correctedHeight = altitude(point) + correction
    const visualHeight = normalizeToTerrain
      ? Math.max(correctedHeight, groundHeight + 1)
      : correctedHeight
    return Cartesian3.fromDegrees(point.lng, point.lat, visualHeight)
  })
}

function smoothedVario(index: number): number {
  const from = Math.max(0, index - 2)
  const to = Math.min(props.points.length - 1, index + 2)
  const values: number[] = []
  for (let cursor = from; cursor <= to; cursor += 1) {
    const value = props.points[cursor]?.varioMs
    if (value !== null && value !== undefined && Number.isFinite(value)) values.push(value)
  }
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function colorForVario(index: number): Color {
  const vario = smoothedVario(index)
  if (vario > 0.3) return Color.fromCssColorString('#22c55e')
  if (vario < -0.3) return Color.fromCssColorString('#ef4444')
  return Color.fromCssColorString('#f59e0b')
}

function setImagery(): void {
  if (!viewer) return
  viewer.imageryLayers.removeAll()
  const provider = new UrlTemplateImageryProvider({
    url:
      props.mapLayer === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maximumLevel: 19,
    credit: props.mapLayer === 'satellite' ? 'Esri World Imagery' : 'OpenStreetMap contributors',
  })
  viewer.imageryLayers.add(new ImageryLayer(provider))
}

function cameraOffset(isTilted: boolean): HeadingPitchRange {
  return new HeadingPitchRange(
    CesiumMath.toRadians(isTilted ? -20 : 0),
    CesiumMath.toRadians(isTilted ? -38 : -90),
    0,
  )
}

function fitTrack(): void {
  if (!viewer || !trackEntity) return
  tilted = true
  void viewer.zoomTo(trackEntity, cameraOffset(true))
}

function toggleTilt(): void {
  if (!viewer || !trackEntity) return
  tilted = !tilted
  void viewer.zoomTo(trackEntity, cameraOffset(tilted))
}

function zoom(factor: number): void {
  if (!viewer) return
  const amount = Math.max(viewer.camera.positionCartographic.height * 0.22, 100)
  if (factor > 0) viewer.camera.zoomIn(amount)
  else viewer.camera.zoomOut(amount)
}

defineExpose({ fitTrack, toggleTilt, zoomIn: () => zoom(1), zoomOut: () => zoom(-1) })

function pointSpeedKmh(index: number): number | null {
  const point = props.points[index]
  const previous = props.points[index - 1]
  if (!point || !previous) return null
  const toSeconds = (time: string) =>
    Number(time.slice(0, 2)) * 3600 + Number(time.slice(2, 4)) * 60 + Number(time.slice(4, 6))
  let duration = toSeconds(point.time) - toSeconds(previous.time)
  if (duration < 0) duration += 86400
  if (!duration) return null
  const radians = Math.PI / 180
  const dLat = (point.lat - previous.lat) * radians
  const dLng = (point.lng - previous.lng) * radians
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(previous.lat * radians) * Math.cos(point.lat * radians) * Math.sin(dLng / 2) ** 2
  return (12742 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)) * 3600) / duration
}

function updateSelectedPoint(): void {
  if (!selectedEntity) return
  const point = props.selectedIndex === null ? null : props.points[props.selectedIndex]
  selectedEntity.show = Boolean(point)
  if (!point) return
  const speedKmh = pointSpeedKmh(props.selectedIndex!)
  const speed =
    speedKmh === null
      ? '—'
      : units.value === 'imperial'
        ? `${Math.round(speedKmh * 0.539956803)} kt`
        : `${Math.round(speedKmh)} km/h`
  selectedEntity.position = trackPositions[props.selectedIndex!] as never
  if (selectedEntity.label) {
    selectedEntity.label.text = [
      formatIgcTime(point.time),
      formatAltitude(altitude(point), units.value),
      formatVario(point.varioMs, units.value),
      speed,
    ].join('\n') as never
  }
}

function closestPointIndex(position: Cartesian2, maxDistance = 28): number | null {
  if (!viewer) return null
  let result: number | null = null
  let closest = maxDistance
  const stride = Math.max(1, Math.ceil(props.points.length / 500))

  function consider(index: number): void {
    const point = props.points[index]
    if (!point) return
    const screen = SceneTransforms.worldToWindowCoordinates(
      viewer!.scene,
      trackPositions[index] ?? Cartesian3.fromDegrees(point.lng, point.lat, altitude(point)),
    )
    if (!screen) return
    const distance = Cartesian2.distance(position, screen)
    if (distance <= closest) {
      closest = distance
      result = index
    }
  }

  for (let index = 0; index < props.points.length; index += stride) consider(index)
  consider(props.points.length - 1)
  if (result !== null && stride > 1) {
    const coarseIndex: number = result
    const from = Math.max(0, coarseIndex - stride)
    const to = Math.min(props.points.length - 1, coarseIndex + stride)
    for (let index = from; index <= to; index += 1) consider(index)
  }
  return result
}

function selectNear(position: Cartesian2): void {
  const index = closestPointIndex(position)
  if (index !== null) emit('update:selectedIndex', index)
}

function updateTrackProgress(): void {
  if (!viewer || trackPositions.length < 2) return
  if (progressFrame !== null) cancelAnimationFrame(progressFrame)
  progressFrame = requestAnimationFrame(() => {
    progressFrame = null
    if (!viewer) return
    const endIndex = Math.max(1, Math.min(props.selectedIndex ?? 0, trackPositions.length - 1))
    const wallPositions = trackPositions.slice(0, endIndex + 1)
    if (playedWallEntity?.wall) {
      playedWallEntity.wall.positions = wallPositions as never
      playedWallEntity.wall.minimumHeights = trackGroundHeights.slice(0, endIndex + 1) as never
    }
    if (playedTrackPrimitive) {
      viewer.scene.primitives.remove(playedTrackPrimitive)
      playedTrackPrimitive = null
    }
    playedTrackPrimitive = viewer.scene.primitives.add(
      new Primitive({
        geometryInstances: new GeometryInstance({
          geometry: new PolylineGeometry({
            positions: trackPositions.slice(0, endIndex + 1),
            width: 2,
            colors: props.points.slice(0, endIndex + 1).map((_, index) => colorForVario(index)),
            colorsPerVertex: true,
            arcType: ArcType.NONE,
          }),
        }),
        appearance: new PolylineColorAppearance({ translucent: false }),
        asynchronous: false,
      }),
    )
  })
}

onMounted(async () => {
  if (!container.value || props.points.length < 2) return
  const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN?.trim()
  let terrainProvider: TerrainProvider | null = null
  if (ionToken) {
    Ion.defaultAccessToken = ionToken
    try {
      terrainProvider = await createWorldTerrainAsync()
    } catch {
      terrainProvider = null
    }
  }
  if (!container.value) return
  viewer = new Viewer(container.value, {
    animation: false,
    baseLayer: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    useBrowserRecommendedResolution: false,
    contextOptions: { webgl: { antialias: true } },
    ...(terrainProvider ? { terrainProvider } : {}),
  })
  viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 2)
  viewer.scene.globe.depthTestAgainstTerrain = false
  setImagery()

  let groundHeights = props.points.map(() => 0)
  let terrainHeightsLoaded = false
  if (terrainProvider) {
    try {
      const terrainPoints = props.points.map((point) =>
        Cartographic.fromDegrees(point.lng, point.lat),
      )
      await sampleTerrainMostDetailed(terrainProvider, terrainPoints)
      const sampledHeights = terrainPoints.map((point) => point.height)
      if (sampledHeights.every((height): height is number => Number.isFinite(height))) {
        groundHeights = sampledHeights
        terrainHeightsLoaded = true
      }
    } catch {
      groundHeights = props.points.map(() => 0)
    }
  }
  if (!viewer || viewer.isDestroyed()) return
  const positions = airbornePositions(groundHeights, terrainHeightsLoaded)
  trackPositions = positions
  trackGroundHeights = groundHeights
  viewer.camera.viewBoundingSphere(BoundingSphere.fromPoints(positions), cameraOffset(true))
  viewer.camera.lookAtTransform(Matrix4.IDENTITY)
  viewer.entities.add({
    wall: {
      positions,
      minimumHeights: groundHeights,
      granularity: CesiumMath.PI,
      material: Color.fromCssColorString('#f59e0b').withAlpha(0.025),
    },
  })
  playedWallEntity = viewer.entities.add({
    wall: {
      positions: positions.slice(0, 2),
      minimumHeights: groundHeights.slice(0, 2),
      granularity: CesiumMath.PI,
      material: Color.fromCssColorString('#f59e0b').withAlpha(0.11),
    },
  })
  const guideStride = Math.max(1, Math.ceil(props.points.length / 52))
  for (let index = 0; index < props.points.length; index += guideStride) {
    const point = props.points[index]!
    viewer.entities.add({
      polyline: {
        positions: [
          Cartesian3.fromDegrees(point.lng, point.lat, groundHeights[index] ?? 0),
          positions[index]!,
        ],
        width: 0.6,
        material: colorForVario(index).withAlpha(0.2),
        arcType: ArcType.NONE,
      },
    })
  }
  trackEntity = viewer.entities.add({
    polyline: { positions, width: 1, material: Color.TRANSPARENT, arcType: ArcType.NONE },
  })
  const trackPrimitive = viewer.scene.primitives.add(
    new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: new PolylineGeometry({
          positions,
          width: 2,
          colors: props.points.map((_, index) => colorForVario(index).withAlpha(0.22)),
          colorsPerVertex: true,
          arcType: ArcType.NONE,
        }),
      }),
      appearance: new PolylineColorAppearance({ translucent: true }),
      asynchronous: true,
    }),
  )

  removePostRenderListener = viewer.scene.postRender.addEventListener(() => {
    if (!viewer?.scene.globe.tilesLoaded || !trackPrimitive.ready) return
    sceneReady.value = true
    removePostRenderListener?.()
    removePostRenderListener = null
    if (loadingFallbackTimer) clearTimeout(loadingFallbackTimer)
    loadingFallbackTimer = null
  })
  loadingFallbackTimer = setTimeout(() => {
    sceneReady.value = true
    removePostRenderListener?.()
    removePostRenderListener = null
    loadingFallbackTimer = null
  }, 12_000)
  updateTrackProgress()

  const start = props.points[0]!
  const end = props.points[props.points.length - 1]!
  viewer.entities.add({
    position: Cartesian3.fromDegrees(start.lng, start.lat, groundHeights[0] ?? 0),
    point: { pixelSize: 8, color: Color.LIME, outlineColor: Color.WHITE, outlineWidth: 2 },
  })
  viewer.entities.add({
    position: Cartesian3.fromDegrees(end.lng, end.lat, groundHeights.at(-1) ?? 0),
    point: { pixelSize: 8, color: Color.RED, outlineColor: Color.WHITE, outlineWidth: 2 },
  })
  selectedEntity = viewer.entities.add({
    show: false,
    position: positions[0],
    point: { pixelSize: 9, color: Color.YELLOW, outlineColor: Color.DARKORANGE, outlineWidth: 2 },
    label: {
      text: '',
      font: '12px sans-serif',
      fillColor: Color.fromCssColorString('#0f172a'),
      showBackground: true,
      backgroundColor: Color.WHITE.withAlpha(0.96),
      backgroundPadding: new Cartesian2(10, 7),
      pixelOffset: new Cartesian2(0, -36),
    },
  })

  inputHandler = new ScreenSpaceEventHandler(viewer.scene.canvas)
  inputHandler.setInputAction(
    (movement: { endPosition: Cartesian2 }) => selectNear(movement.endPosition),
    ScreenSpaceEventType.MOUSE_MOVE,
  )
  inputHandler.setInputAction(
    (movement: { position: Cartesian2 }) => selectNear(movement.position),
    ScreenSpaceEventType.LEFT_CLICK,
  )
  resizeObserver = new ResizeObserver(() => viewer?.resize())
  resizeObserver.observe(container.value)
})

watch(() => props.mapLayer, setImagery)
watch(
  () => props.selectedIndex,
  () => {
    updateSelectedPoint()
    updateTrackProgress()
  },
)
watch(units, updateSelectedPoint)

onBeforeUnmount(() => {
  if (progressFrame !== null) cancelAnimationFrame(progressFrame)
  removePostRenderListener?.()
  if (loadingFallbackTimer) clearTimeout(loadingFallbackTimer)
  resizeObserver?.disconnect()
  inputHandler?.destroy()
  viewer?.destroy()
  resizeObserver = null
  removePostRenderListener = null
  loadingFallbackTimer = null
  inputHandler = null
  selectedEntity = null
  playedWallEntity = null
  playedTrackPrimitive = null
  trackPositions = []
  trackGroundHeights = []
  progressFrame = null
  trackEntity = null
  viewer = null
})
</script>

<template>
  <div class="absolute inset-0 overflow-hidden bg-slate-50">
    <div
      ref="container"
      class="size-full transition-opacity duration-300"
      :class="sceneReady ? 'opacity-100' : 'opacity-0'"
    />
    <div
      v-if="!sceneReady"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-600"
      role="status"
      aria-live="polite"
    >
      <span class="size-9 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />
      <span class="text-sm font-medium">Loading 3D track…</span>
    </div>
    <div
      v-if="sceneReady"
      class="pointer-events-none absolute bottom-2 right-2 flex gap-2 rounded bg-slate-950/75 px-2 py-1 text-[10px] text-white"
    >
      <span class="flex items-center gap-1"
        ><i class="size-2 rounded-full bg-green-500" />Climb</span
      >
      <span class="flex items-center gap-1"
        ><i class="size-2 rounded-full bg-amber-500" />Level</span
      >
      <span class="flex items-center gap-1"
        ><i class="size-2 rounded-full bg-red-500" />Descent</span
      >
    </div>
  </div>
</template>

<style scoped>
:deep(.cesium-viewer),
:deep(.cesium-viewer-cesiumWidgetContainer),
:deep(.cesium-widget),
:deep(.cesium-widget canvas) {
  height: 100%;
  width: 100%;
}
</style>
