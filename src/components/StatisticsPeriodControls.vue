<script setup lang="ts">
import {
  STATISTICS_PRESET_OPTIONS,
  type StatisticsPresetId,
} from '@/lib/statisticsPeriod'

defineProps<{
  from: string
  to: string
  preset: StatisticsPresetId
}>()

const emit = defineEmits<{
  'update:from': [value: string]
  'update:to': [value: string]
  preset: [value: StatisticsPresetId]
}>()
</script>

<template>
  <section
    class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-4 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"
  >
    <h2 class="text-sm font-medium text-slate-500 sm:hidden">Period</h2>

    <div class="-mx-1 mt-2 overflow-x-auto px-1 pb-2.5 sm:m-0 sm:overflow-visible sm:p-0">
      <div
        class="flex w-max gap-1.5 sm:w-auto sm:gap-0 sm:overflow-hidden sm:rounded-md sm:border sm:border-slate-300 sm:bg-white"
      >
        <button
          v-for="option in STATISTICS_PRESET_OPTIONS"
          :key="option.id"
          type="button"
          class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition sm:rounded-none sm:border-l sm:border-slate-200 sm:px-3 sm:py-2 sm:text-sm sm:first:border-l-0"
          :class="
            preset === option.id
              ? 'bg-sky-700 text-white sm:bg-sky-50 sm:text-sky-800 sm:shadow-[inset_0_0_0_1px_#7dd3fc]'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 sm:bg-white sm:hover:bg-slate-50'
          "
          :aria-pressed="preset === option.id"
          @click="emit('preset', option.id)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div
      class="mt-4 gap-4 sm:mt-0 sm:flex sm:items-end sm:gap-2"
      :class="preset === 'custom' ? 'grid grid-cols-1' : 'hidden'"
    >
      <label class="block text-sm sm:flex sm:items-center sm:gap-2">
        <span class="font-medium text-slate-700">From</span>
        <input
          :value="from"
          type="date"
          class="field-control mt-1 sm:mt-0 sm:w-auto sm:py-1.5"
          @input="emit('update:from', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="block text-sm sm:flex sm:items-center sm:gap-2">
        <span class="font-medium text-slate-700">To</span>
        <input
          :value="to"
          type="date"
          class="field-control mt-1 sm:mt-0 sm:w-auto sm:py-1.5"
          @input="emit('update:to', ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>
  </section>
</template>
