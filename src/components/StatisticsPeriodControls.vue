<script setup lang="ts">
import {
  STATISTICS_PRESET_OPTIONS,
  type StatisticsPresetId,
} from '@/lib/statisticsPeriod'

defineProps<{
  from: string
  to: string
  preset: StatisticsPresetId
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:from': [value: string]
  'update:to': [value: string]
  preset: [value: StatisticsPresetId]
}>()
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in STATISTICS_PRESET_OPTIONS"
        :key="option.id"
        type="button"
        class="rounded-full px-3 py-1.5 text-sm font-medium transition"
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

    <p v-if="saving" class="mt-3 text-xs text-slate-500">Saving period…</p>
  </section>
</template>
