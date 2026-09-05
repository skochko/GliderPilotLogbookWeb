<script setup lang="ts">
import { computed } from 'vue'
import { pointAltitude, type IgcPoint } from '@/lib/igc'
import {
  formatAltitudeValue,
  formatDistanceValue,
  type MeasurementUnits,
} from '@/lib/measurementUnits'

const props = defineProps<{
  points: readonly IgcPoint[]
  units: MeasurementUnits
  altitudeOffsetM: number
}>()

function seconds(time: string): number {
  return Number(time.slice(0, 2)) * 3600 + Number(time.slice(2, 4)) * 60 + Number(time.slice(4, 6))
}

function elapsed(from: string, to: string): number {
  let value = seconds(to) - seconds(from)
  if (value < 0) value += 86400
  return value
}

function distanceKm(a: IgcPoint, b: IgcPoint): number {
  const radians = Math.PI / 180
  const dLat = (b.lat - a.lat) * radians
  const dLng = (b.lng - a.lng) * radians
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function durationText(value: number): string {
  return [Math.floor(value / 3600), Math.floor((value % 3600) / 60), value % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

const totalDistance = computed(() =>
  props.points
    .slice(1)
    .reduce((sum, point, index) => sum + distanceKm(props.points[index]!, point), 0),
)
const totalClimb = computed(() =>
  props.points
    .slice(1)
    .reduce(
      (sum, point, index) =>
        sum + Math.max(0, (pointAltitude(point) ?? 0) - (pointAltitude(props.points[index]!) ?? 0)),
      0,
    ),
)
const maximum = computed(
  () => Math.max(...props.points.map((point) => pointAltitude(point) ?? 0)) - props.altitudeOffsetM,
)
const duration = computed(() =>
  props.points.length > 1 ? elapsed(props.points[0]!.time, props.points.at(-1)!.time) : 0,
)
</script>

<template>
  <div class="grid shrink-0 grid-cols-4 border-b border-slate-200 bg-white px-3 py-3 sm:px-6">
    <div class="flex min-w-0 items-center justify-center gap-0.5 pr-1 sm:gap-1 sm:pr-2">
      <svg
        viewBox="0 0 32 32"
        class="size-7 shrink-0 text-slate-900"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="m3 26 8-16 5 8 4-7 9 15H3Z" />
        <path d="m8 20 3-3 3 3 2-2 3 3" />
      </svg>
      <div class="min-w-0">
        <span class="block truncate text-[9px] text-slate-500 sm:text-xs">Max alt.</span>
        <strong class="block truncate text-xs text-slate-900 sm:text-base">{{
          formatAltitudeValue(maximum, units)
        }}</strong>
      </div>
    </div>
    <div
      class="flex min-w-0 items-center justify-center gap-0.5 border-l border-slate-200 px-1 sm:gap-1 sm:px-2"
    >
      <svg
        viewBox="0 0 32 32"
        class="size-7 shrink-0 text-slate-900"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M16 28V5" />
        <path d="m8 13 8-8 8 8" />
      </svg>
      <div class="min-w-0">
        <span class="block truncate text-[9px] text-slate-500 sm:text-xs">Total climb</span>
        <strong class="block truncate text-xs text-slate-900 sm:text-base">{{
          formatAltitudeValue(totalClimb, units)
        }}</strong>
      </div>
    </div>
    <div
      class="flex min-w-0 items-center justify-center gap-0.5 border-l border-slate-200 px-1 sm:gap-1 sm:px-2"
    >
      <svg
        viewBox="0 0 32 32"
        class="size-7 shrink-0 text-slate-900"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="16" cy="16" r="12" />
        <path d="M16 9v8l5 3" />
      </svg>
      <div class="min-w-0">
        <span class="block truncate text-[9px] text-slate-500 sm:text-xs">Duration</span>
        <strong class="block whitespace-nowrap text-xs text-slate-900 sm:text-base">{{
          durationText(duration)
        }}</strong>
      </div>
    </div>
    <div
      class="flex min-w-0 items-center justify-center gap-0.5 border-l border-slate-200 pl-1 sm:gap-1 sm:pl-2"
    >
      <svg
        viewBox="0 0 32 32"
        class="size-7 shrink-0 text-slate-900"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="10" cy="24" r="3" />
        <circle cx="22" cy="8" r="3" />
        <path d="M10 21c0-7 12-3 12-10" />
      </svg>
      <div class="min-w-0">
        <span class="block truncate text-[9px] text-slate-500 sm:text-xs">Distance</span>
        <strong class="block truncate text-xs text-slate-900 sm:text-base">{{
          formatDistanceValue(totalDistance, units)
        }}</strong>
      </div>
    </div>
  </div>
</template>
