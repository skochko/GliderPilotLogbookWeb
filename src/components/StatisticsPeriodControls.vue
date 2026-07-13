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
  <section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <h2 class="text-sm font-medium text-slate-500">Period</h2>

    <div class="-mx-1 mt-2 overflow-x-auto px-1 pb-2.5 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
      <div class="flex w-max gap-1.5 sm:w-auto sm:flex-wrap sm:gap-2">
        <button
          v-for="option in STATISTICS_PRESET_OPTIONS"
          :key="option.id"
          type="button"
          class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:py-1.5 sm:text-sm"
          :class="
            preset === option.id
              ? 'bg-sky-700 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          "
          @click="emit('preset', option.id)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div
      class="mt-4 gap-4 sm:grid-cols-2"
      :class="preset === 'custom' ? 'grid grid-cols-1' : 'hidden sm:grid'"
    >
      <label class="block text-sm">
        <span class="font-medium text-slate-700">From</span>
        <input
          :value="from"
          type="date"
          class="field-control mt-1"
          @input="emit('update:from', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium text-slate-700">To</span>
        <input
          :value="to"
          type="date"
          class="field-control mt-1"
          @input="emit('update:to', ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>
  </section>
</template>
