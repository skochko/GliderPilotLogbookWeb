<script setup lang="ts">
import { computed } from 'vue'
import { formatBytes } from '@/lib/formatBytes'

const props = defineProps<{
  label: string
  percent: number | null
  loaded: number
  total: number | null
}>()

const indeterminate = computed(() => props.percent === null)

const progressLabel = computed(() => {
  if (props.total !== null && props.total > 0) {
    return `${formatBytes(props.loaded)} / ${formatBytes(props.total)}`
  }
  return formatBytes(props.loaded)
})
</script>

<template>
  <div class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
    <div class="mb-1.5 flex items-center justify-between gap-3 text-xs text-slate-600">
      <span class="truncate">{{ label }}</span>
      <span class="shrink-0 tabular-nums">
        <template v-if="!indeterminate">{{ percent }}%</template>
        <template v-else>Uploading…</template>
      </span>
    </div>

    <div
      class="h-2 overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
      :aria-valuenow="percent ?? undefined"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="label"
    >
      <div
        v-if="!indeterminate"
        class="h-full rounded-full bg-sky-600 transition-[width] duration-150 ease-out"
        :style="{ width: `${percent}%` }"
      />
      <div v-else class="relative h-full w-full overflow-hidden">
        <div
          class="absolute inset-y-0 w-1/3 rounded-full bg-sky-500 motion-safe:animate-[upload-indeterminate_1.2s_ease-in-out_infinite]"
        />
      </div>
    </div>

    <p class="mt-1 text-[11px] tabular-nums text-slate-500">{{ progressLabel }}</p>
  </div>
</template>

<style scoped>
@keyframes upload-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}
</style>
