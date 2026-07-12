<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatIgcTime, getAltitudeStats, pointAltitude, type IgcPoint } from '@/lib/igc'

const props = defineProps<{
  points: readonly IgcPoint[]
  selectedIndex: number | null
}>()

const emit = defineEmits<{
  'update:selectedIndex': [number | null]
}>()

const svgRef = ref<SVGSVGElement | null>(null)

const padding = { top: 8, right: 8, bottom: 20, left: 40 }
const viewWidth = 600
const viewHeight = 120

const stats = computed(() => getAltitudeStats(props.points))

const chartPoints = computed(() =>
  props.points
    .map((point, index) => ({ point, index, altitude: pointAltitude(point) }))
    .filter((entry): entry is { point: IgcPoint; index: number; altitude: number } => entry.altitude !== null),
)

const linePath = computed(() => {
  if (chartPoints.value.length === 0 || !stats.value) {
    return ''
  }

  const plotWidth = viewWidth - padding.left - padding.right
  const plotHeight = viewHeight - padding.top - padding.bottom
  const lastIndex = Math.max(props.points.length - 1, 1)

  return chartPoints.value
    .map(({ index, altitude }, pointIndex) => {
      const x = padding.left + (index / lastIndex) * plotWidth
      const y =
        padding.top +
        (1 - (altitude - stats.value!.min) / (stats.value!.max - stats.value!.min || 1)) * plotHeight
      return `${pointIndex === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
})

const selectedX = computed(() => {
  if (props.selectedIndex === null || props.points.length <= 1) {
    return null
  }

  const plotWidth = viewWidth - padding.left - padding.right
  const lastIndex = Math.max(props.points.length - 1, 1)
  return padding.left + (props.selectedIndex / lastIndex) * plotWidth
})

const yTicks = computed(() => {
  if (!stats.value) {
    return []
  }
  const plotHeight = viewHeight - padding.top - padding.bottom
  return [stats.value.max, stats.value.min].map((altitude) => ({
    altitude,
    y:
      padding.top +
      (1 - (altitude - stats.value!.min) / (stats.value!.max - stats.value!.min || 1)) * plotHeight,
  }))
})

function indexFromClientX(clientX: number): number | null {
  const svg = svgRef.value
  if (!svg || props.points.length === 0) {
    return null
  }

  const rect = svg.getBoundingClientRect()
  const relativeX = ((clientX - rect.left) / rect.width) * viewWidth
  const plotWidth = viewWidth - padding.left - padding.right
  const ratio = (relativeX - padding.left) / plotWidth
  const clamped = Math.max(0, Math.min(1, ratio))
  return Math.round(clamped * (props.points.length - 1))
}

function onPointerMove(event: PointerEvent): void {
  const index = indexFromClientX(event.clientX)
  emit('update:selectedIndex', index)
}

function onPointerLeave(): void {
  emit('update:selectedIndex', null)
}
</script>

<template>
  <div class="rounded-md border border-slate-200 bg-slate-50 px-2 py-2">
    <div class="mb-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">
      <span>Altitude profile</span>
      <span v-if="selectedIndex !== null">{{ formatIgcTime(points[selectedIndex]?.time ?? '') }}</span>
    </div>

    <svg
      ref="svgRef"
      viewBox="0 0 600 120"
      class="h-28 w-full touch-none"
      role="img"
      aria-label="Altitude profile chart"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
      @pointerdown="onPointerMove"
    >
      <line
        :x1="padding.left"
        :y1="viewHeight - padding.bottom"
        :x2="viewWidth - padding.right"
        :y2="viewHeight - padding.bottom"
        class="stroke-slate-300"
        stroke-width="1"
      />

      <text
        v-for="tick in yTicks"
        :key="tick.altitude"
        :x="padding.left - 6"
        :y="tick.y + 3"
        text-anchor="end"
        class="fill-slate-400 text-[10px]"
      >
        {{ Math.round(tick.altitude) }}
      </text>

      <path
        v-if="linePath"
        :d="linePath"
        fill="none"
        class="stroke-sky-600"
        stroke-width="1.75"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <line
        v-if="selectedX !== null"
        :x1="selectedX"
        :y1="padding.top"
        :x2="selectedX"
        :y2="viewHeight - padding.bottom"
        class="stroke-amber-500"
        stroke-width="1.5"
        stroke-dasharray="4 3"
      />
    </svg>
  </div>
</template>
