<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { formatIgcTime, pointAltitude, type IgcPoint } from '@/lib/igc'
import {
  altitudeScaleValue,
  formatAltitudeValue,
  formatDistanceValue,
  formatVarioValue,
  type MeasurementUnits,
} from '@/lib/measurementUnits'

const props = defineProps<{
  points: readonly IgcPoint[]
  selectedIndex: number | null
  startIndex: number
  units: MeasurementUnits
}>()
const emit = defineEmits<{
  'update:selectedIndex': [number | null]
  'update:startIndex': [number]
}>()
type Mode = 'altitude' | 'vario' | 'speed'
const mode = ref<Mode>('altitude')
const svgRef = ref<SVGSVGElement | null>(null)
const playing = ref(false)
let timer: ReturnType<typeof setInterval> | null = null
const width = ref(600)
const height = 118
const pad = { left: 42, right: 8, top: 12, bottom: 20 }

function seconds(time: string): number {
  return Number(time.slice(0, 2)) * 3600 + Number(time.slice(2, 4)) * 60 + Number(time.slice(4, 6))
}
function elapsed(from: string, to: string): number {
  let value = seconds(to) - seconds(from)
  if (value < 0) value += 86400
  return value
}
function distanceKm(a: IgcPoint, b: IgcPoint): number {
  const r = Math.PI / 180
  const dLat = (b.lat - a.lat) * r
  const dLng = (b.lng - a.lng) * r
  const value =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}
const speedKmh = computed(() =>
  props.points.map((point, index) => {
    const previous = props.points[index - 1]
    if (!previous) return 0
    const duration = elapsed(previous.time, point.time)
    return duration ? (distanceKm(previous, point) * 3600) / duration : 0
  }),
)
const values = computed(() =>
  props.points.map((point, index) => {
    if (mode.value === 'vario') return point.varioMs ?? 0
    if (mode.value === 'speed')
      return (speedKmh.value[index] ?? 0) * (props.units === 'imperial' ? 0.539956803 : 1)
    return altitudeScaleValue(pointAltitude(point) ?? 0, props.units)
  }),
)
const bounds = computed(() => {
  const min = Math.min(...values.value)
  const max = Math.max(...values.value)
  const margin = Math.max((max - min) * 0.06, 1)
  return { min: min - margin, max: max + margin }
})
function xy(index: number, value: number): [number, number] {
  return [
    pad.left +
      (index / Math.max(props.points.length - 1, 1)) * (width.value - pad.left - pad.right),
    pad.top +
      (1 - (value - bounds.value.min) / (bounds.value.max - bounds.value.min || 1)) *
        (height - pad.top - pad.bottom),
  ]
}
const line = computed(() =>
  values.value
    .map((value, index) => {
      const [x, y] = xy(index, value)
      return `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' '),
)
const area = computed(
  () =>
    `${line.value} L${width.value - pad.right},${height - pad.bottom} L${pad.left},${height - pad.bottom}Z`,
)
const active = computed(() => props.selectedIndex ?? 0)
const rangeMaximum = computed(() => Math.max(props.points.length - 1, 1))
const rangeStyle = computed(() => {
  const start = (props.startIndex / rangeMaximum.value) * 100
  const end = (active.value / rangeMaximum.value) * 100
  return {
    backgroundImage: `linear-gradient(to right, #cbd5e1 ${start}%, #0284c7 ${start}%, #0284c7 ${end}%, #cbd5e1 ${end}%)`,
  }
})
const activePoint = computed(() => props.points[active.value])
const marker = computed(() => xy(active.value, values.value[active.value] ?? 0))
const startMarker = computed(() => xy(props.startIndex, values.value[props.startIndex] ?? 0))
const totalDistance = computed(() =>
  props.points.slice(1).reduce((sum, point, i) => sum + distanceKm(props.points[i]!, point), 0),
)
const totalClimb = computed(() =>
  props.points
    .slice(1)
    .reduce(
      (sum, point, i) =>
        sum + Math.max(0, (pointAltitude(point) ?? 0) - (pointAltitude(props.points[i]!) ?? 0)),
      0,
    ),
)
const maximum = computed(() => Math.max(...props.points.map((point) => pointAltitude(point) ?? 0)))
const duration = computed(() =>
  props.points.length > 1 ? elapsed(props.points[0]!.time, props.points.at(-1)!.time) : 0,
)
const ticks = computed(() =>
  [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    point: props.points[Math.round(ratio * (props.points.length - 1))],
  })),
)
function durationText(value: number): string {
  return [Math.floor(value / 3600), Math.floor((value % 3600) / 60), value % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}
function activeValue(): string {
  if (!activePoint.value) return '—'
  if (mode.value === 'vario') return formatVarioValue(activePoint.value.varioMs, props.units)
  if (mode.value === 'speed')
    return `${Math.round(values.value[active.value] ?? 0)} ${props.units === 'imperial' ? 'kt' : 'km/h'}`
  return formatAltitudeValue(pointAltitude(activePoint.value), props.units)
}
function selectAt(clientX: number): void {
  if (!svgRef.value) return
  const rect = svgRef.value.getBoundingClientRect()
  const chartX = ((clientX - rect.left) / rect.width) * width.value
  const ratio = Math.max(0, Math.min(1, (chartX - pad.left) / (width.value - pad.left - pad.right)))
  emit('update:selectedIndex', Math.round(ratio * (props.points.length - 1)))
}
function togglePlay(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
    playing.value = false
    return
  }
  playing.value = true
  timer = setInterval(() => {
    const next = active.value + Math.max(1, Math.ceil(props.points.length / 400))
    if (next >= props.points.length) {
      emit('update:selectedIndex', 0)
      togglePlay()
    } else emit('update:selectedIndex', next)
  }, 60)
}
function updateStart(value: number): void {
  const start = Math.max(0, Math.min(value, rangeMaximum.value))
  emit('update:startIndex', start)
  if (active.value < start) emit('update:selectedIndex', start)
}
function updateEnd(value: number): void {
  emit('update:selectedIndex', Math.max(props.startIndex, value))
}
let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  if (!svgRef.value) return
  resizeObserver = new ResizeObserver(([entry]) => {
    const rect = entry?.contentRect
    if (rect?.width && rect.height) width.value = Math.max(320, (rect.width / rect.height) * height)
  })
  resizeObserver.observe(svgRef.value)
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (timer) clearInterval(timer)
})
</script>

<template>
  <section
    class="rounded-t-2xl bg-white px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_18px_rgba(15,23,42,.12)] sm:px-6"
  >
    <div class="mx-auto mb-1.5 h-1 w-16 rounded-full bg-slate-300" />
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-base font-semibold text-slate-900 sm:text-lg">Altitude profile</h3>
      <div
        class="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-medium text-slate-600 sm:text-xs"
      >
        <button
          v-for="item in [
            { value: 'altitude', label: 'Altitude' },
            { value: 'vario', label: 'Vario' },
            { value: 'speed', label: 'Speed' },
          ] as const"
          :key="item.value"
          class="rounded-md px-2.5 py-1.5"
          :class="mode === item.value ? 'bg-sky-700 text-white shadow-sm' : ''"
          @click="mode = item.value"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
    <svg
      ref="svgRef"
      :viewBox="`0 0 ${width} ${height}`"
      class="h-[105px] w-full touch-none"
      @pointermove="selectAt($event.clientX)"
      @pointerdown="selectAt($event.clientX)"
    >
      <defs>
        <linearGradient id="profile-fill" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#38bdf8" stop-opacity=".3" />
          <stop offset="1" stop-color="#38bdf8" stop-opacity=".03" />
        </linearGradient>
      </defs>
      <line
        v-for="ratio in [0, 0.5, 1]"
        :key="ratio"
        :x1="pad.left"
        :x2="width - pad.right"
        :y1="pad.top + ratio * (height - pad.top - pad.bottom)"
        :y2="pad.top + ratio * (height - pad.top - pad.bottom)"
        class="stroke-slate-200"
      />
      <path :d="area" fill="url(#profile-fill)" />
      <path :d="line" fill="none" class="stroke-sky-500" stroke-width="2" />
      <line
        v-if="startIndex > 0"
        :x1="startMarker[0]"
        :x2="startMarker[0]"
        :y1="pad.top"
        :y2="height - pad.bottom"
        class="stroke-sky-700"
        stroke-width="1.5"
        stroke-dasharray="3 3"
      />
      <circle
        v-if="startIndex > 0"
        :cx="startMarker[0]"
        :cy="startMarker[1]"
        r="4"
        class="fill-white stroke-sky-700"
        stroke-width="2"
      />
      <line
        :x1="marker[0]"
        :x2="marker[0]"
        :y1="pad.top"
        :y2="height - pad.bottom"
        class="stroke-sky-500"
      />
      <circle
        :cx="marker[0]"
        :cy="marker[1]"
        r="5"
        class="fill-sky-600 stroke-white"
        stroke-width="2"
      />
      <text
        v-for="tick in ticks"
        :key="tick.ratio"
        :x="pad.left + tick.ratio * (width - pad.left - pad.right)"
        :y="height - 4"
        :text-anchor="tick.ratio === 0 ? 'start' : tick.ratio === 1 ? 'end' : 'middle'"
        class="fill-slate-500 text-[9px]"
      >
        {{ formatIgcTime(tick.point?.time ?? '').slice(0, 5) }}
      </text>
      <g :transform="`translate(${Math.max(48, Math.min(width - 48, marker[0]))},1)`">
        <rect x="-39" width="78" height="28" rx="6" class="fill-white stroke-slate-200" />
        <text y="11" text-anchor="middle" class="fill-slate-800 text-[8px] font-semibold">
          {{ activeValue() }}
        </text>
        <text y="22" text-anchor="middle" class="fill-slate-500 text-[8px]">
          {{ formatIgcTime(activePoint?.time ?? '') }}
        </text>
      </g>
    </svg>
    <div class="grid grid-cols-4 gap-2">
      <div
        v-for="item in [
          { label: 'Max alt.', value: formatAltitudeValue(maximum, units) },
          { label: 'Total climb', value: formatAltitudeValue(totalClimb, units) },
          { label: 'Duration', value: durationText(duration) },
          { label: 'Distance', value: formatDistanceValue(totalDistance, units) },
        ]"
        :key="item.label"
        class="rounded-xl bg-slate-50 px-2 py-1.5"
      >
        <span class="block truncate text-[9px] text-slate-500">{{ item.label }}</span
        ><strong class="block truncate text-[11px] text-slate-900">{{ item.value }}</strong>
      </div>
    </div>
    <div class="relative mt-2 h-10">
      <button
        type="button"
        class="absolute left-0 top-0 flex size-9 items-center justify-center rounded-full bg-sky-700 text-xs text-white"
        @click="togglePlay"
      >
        {{ playing ? 'Ⅱ' : '▶' }}
      </button>
      <div
        class="range-slider absolute top-1.5 h-6"
        :style="[
          {
            left: `${(pad.left * 105) / height}px`,
            right: `${(pad.right * 105) / height}px`,
          },
          rangeStyle,
        ]"
      >
        <input
          aria-label="Track range start"
          type="range"
          min="0"
          :max="rangeMaximum"
          :value="startIndex"
          @input="updateStart(Number(($event.target as HTMLInputElement).value))"
        />
        <input
          aria-label="Track range end"
          type="range"
          min="0"
          :max="rangeMaximum"
          :value="active"
          @input="updateEnd(Number(($event.target as HTMLInputElement).value))"
        />
      </div>
      <span class="absolute right-0 top-7 text-[10px] text-slate-500">
        {{ formatIgcTime(activePoint?.time ?? '') }}
      </span>
    </div>
  </section>
</template>

<style scoped>
.range-slider {
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 4px;
  border-radius: 9999px;
}

.range-slider input {
  appearance: none;
  background: transparent;
  height: 24px;
  left: -9px;
  margin: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: calc(100% + 18px);
}

.range-slider input::-webkit-slider-runnable-track {
  background: transparent;
  height: 4px;
}

.range-slider input::-webkit-slider-thumb {
  appearance: none;
  background: #0284c7;
  border: 2px solid white;
  border-radius: 9999px;
  box-shadow: 0 1px 4px rgb(15 23 42 / 35%);
  height: 18px;
  margin-top: -7px;
  pointer-events: auto;
  width: 18px;
}

.range-slider input::-moz-range-thumb {
  background: #0284c7;
  border: 2px solid white;
  border-radius: 9999px;
  box-shadow: 0 1px 4px rgb(15 23 42 / 35%);
  height: 14px;
  pointer-events: auto;
  width: 14px;
}

.range-slider input::-moz-range-track {
  background: transparent;
  height: 4px;
}
</style>
