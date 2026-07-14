<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  loaded: number
  total: number
  percent: number
  flightsLoaded: number
}>()

const indeterminate = computed(() => props.total <= 0)
const countLabel = computed(() => {
  if (props.flightsLoaded > 0) {
    return `${props.flightsLoaded.toLocaleString()} flights`
  }
  return 'Reading spreadsheet…'
})
const percentLabel = computed(() => (indeterminate.value ? 'Starting sync…' : `${props.percent}% complete`))
</script>

<template>
  <div
    class="rounded-lg border border-sky-200 bg-sky-50 px-4 py-4 shadow-sm"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div class="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
      <span class="font-medium text-slate-900">Syncing logbook from Google…</span>
      <span>{{ countLabel }}</span>
    </div>
    <div class="mt-3 h-2 overflow-hidden rounded-full bg-sky-100">
      <div
        v-if="indeterminate"
        class="sync-progress-indeterminate h-full w-1/3 rounded-full bg-sky-600"
      />
      <div
        v-else
        class="h-full rounded-full bg-sky-600 transition-[width] duration-300 ease-out"
        :style="{ width: `${percent}%` }"
      />
    </div>
    <p class="mt-2 text-xs text-slate-600">
      {{ percentLabel }}
    </p>
  </div>
</template>

<style scoped>
.sync-progress-indeterminate {
  animation: sync-progress-slide 1.4s ease-in-out infinite;
}

@keyframes sync-progress-slide {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(360%);
  }
}
</style>
