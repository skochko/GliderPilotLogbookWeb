<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DeepReadonly } from 'vue'
import { formatDecimalHours } from '@/lib/duration'
import {
  buildFlyingTotalsRows,
  flyingBreakdownRows,
  flyingSummaryRows,
  rowCountClass,
  rowHoursClass,
} from '@/lib/flyingTotalsRows'
import type { Statistics } from '@/types'

const props = defineProps<{
  statistics: DeepReadonly<Statistics>
}>()

const expanded = ref(false)

const rows = computed(() => buildFlyingTotalsRows(props.statistics))
const summaryRows = computed(() => flyingSummaryRows(rows.value))
const breakdownRows = computed(() => flyingBreakdownRows(rows.value))
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:p-4">
    <h2 class="text-sm font-medium text-slate-500">Your flying</h2>

    <button
      type="button"
      class="mt-2 flex w-full items-center justify-between gap-4 rounded-md text-left transition hover:bg-slate-50"
      :class="expanded ? 'pb-2' : ''"
      :aria-expanded="expanded"
      aria-controls="flying-breakdown"
      @click="expanded = !expanded"
    >
      <div class="min-w-0 flex-1 space-y-2">
        <div
          v-for="row in summaryRows"
          :key="row.key"
          class="flex items-baseline justify-between gap-4"
        >
          <span
            v-if="row.badgeClass"
            class="inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset"
            :class="row.badgeClass"
          >
            {{ row.label }}
          </span>
          <span v-else class="text-sm font-medium text-slate-700">{{ row.label }}</span>
          <span class="text-right">
            <span class="block tabular-nums text-slate-900" :class="rowHoursClass(row.key)">
              {{ formatDecimalHours(row.hours) }}
            </span>
            <span class="block text-slate-500" :class="rowCountClass(row.key)">
              {{ row.count }} {{ row.countLabel }}
            </span>
          </span>
        </div>
      </div>
      <svg
        class="h-4 w-4 shrink-0 text-slate-400 transition-transform"
        :class="expanded ? 'rotate-180' : ''"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div class="mt-2 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 pt-2 text-xs text-slate-500">
      <span>{{ statistics.days_flown }} {{ statistics.days_flown === 1 ? 'day' : 'days' }} flown</span>
      <span>Avg flight {{ formatDecimalHours(statistics.avg_flight_hours) }}</span>
    </div>

    <dl
      v-show="expanded"
      id="flying-breakdown"
      class="border-t border-slate-100 pt-1"
    >
      <div
        v-for="row in breakdownRows"
        :key="row.key"
        class="flex items-baseline justify-between gap-4 py-1 pl-2"
      >
        <dt class="flex min-w-0 items-center gap-2">
          <span
            v-if="row.badgeClass"
            class="inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset"
            :class="row.badgeClass"
          >
            {{ row.label }}
          </span>
        </dt>
        <dd class="text-right">
          <p class="tabular-nums text-slate-900" :class="rowHoursClass(row.key)">
            {{ formatDecimalHours(row.hours) }}
          </p>
          <p v-if="row.countLabel" class="text-slate-500" :class="rowCountClass(row.key)">
            {{ row.count }} {{ row.countLabel }}
          </p>
        </dd>
      </div>
    </dl>
  </section>
</template>
