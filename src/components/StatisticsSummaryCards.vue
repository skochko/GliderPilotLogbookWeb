<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DeepReadonly } from 'vue'
import { formatDecimalHours } from '@/lib/duration'
import {
  buildFlyingTotalsRows,
  flyingBreakdownRows,
  rowCountClass,
  rowHoursClass,
} from '@/lib/flyingTotalsRows'
import type { Statistics } from '@/types'

const props = defineProps<{
  statistics: DeepReadonly<Statistics>
}>()

const expanded = ref(false)

const rows = computed(() => buildFlyingTotalsRows(props.statistics))
const totalRow = computed(() => rows.value.find((row) => row.key === 'total'))
const soloRow = computed(() => rows.value.find((row) => row.key === 'solo'))
const breakdownRows = computed(() => flyingBreakdownRows(rows.value))
</script>

<template>
  <!-- Mobile: summary + role breakdown (replaces separate Summary and Your flying blocks) -->
  <section class="sm:hidden">
    <article class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <h2 class="text-sm font-medium text-slate-500">Summary</h2>

      <button
        type="button"
        class="mt-2 flex w-full items-center justify-between gap-4 rounded-md text-left transition hover:bg-slate-50"
        :class="expanded ? 'pb-2' : ''"
        :aria-expanded="expanded"
        aria-controls="statistics-summary-breakdown"
        @click="expanded = !expanded"
      >
        <div class="min-w-0 flex-1 space-y-2">
          <div v-if="totalRow" class="flex items-baseline justify-between gap-4">
            <span class="text-sm font-medium text-slate-700">Flight time</span>
            <span class="text-right">
              <span class="block tabular-nums text-slate-900" :class="rowHoursClass(totalRow.key)">
                {{ formatDecimalHours(totalRow.hours) }}
              </span>
              <span class="block text-slate-500" :class="rowCountClass(totalRow.key)">
                {{ totalRow.count }} {{ totalRow.countLabel }}
              </span>
            </span>
          </div>

          <div class="flex items-baseline justify-between gap-4">
            <span class="text-sm font-medium text-slate-700">Launches</span>
            <span class="text-right tabular-nums text-sm font-medium text-slate-800">
              {{ statistics.total_launches }}
            </span>
          </div>

          <div v-if="soloRow" class="flex items-baseline justify-between gap-4">
            <span
              class="inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset"
              :class="soloRow.badgeClass"
            >
              {{ soloRow.label }}
            </span>
            <span class="text-right">
              <span class="block tabular-nums text-slate-900" :class="rowHoursClass(soloRow.key)">
                {{ formatDecimalHours(soloRow.hours) }}
              </span>
              <span class="block text-slate-500" :class="rowCountClass(soloRow.key)">
                {{ soloRow.count }} {{ soloRow.countLabel }}
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

      <div
        class="mt-2 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 pt-2 text-xs text-slate-500"
      >
        <span>
          {{ statistics.days_flown }}
          {{ statistics.days_flown === 1 ? 'day' : 'days' }} flown
        </span>
        <span>Avg flight {{ formatDecimalHours(statistics.avg_flight_hours) }}</span>
      </div>

      <dl
        v-show="expanded"
        id="statistics-summary-breakdown"
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
    </article>
  </section>

  <!-- Desktop: separate cards -->
  <section class="hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-5">
    <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-sm font-medium text-slate-500">Flights</p>
      <p class="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{{ statistics.total_flights }}</p>
    </article>
    <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-sm font-medium text-slate-500">Flight time</p>
      <p class="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
        {{ formatDecimalHours(statistics.total_flight_hours) }}
      </p>
    </article>
    <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-sm font-medium text-slate-500">Launches</p>
      <p class="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{{ statistics.total_launches }}</p>
    </article>
    <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-sm font-medium text-slate-500">Days flown</p>
      <p class="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{{ statistics.days_flown }}</p>
    </article>
    <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-sm font-medium text-slate-500">Avg flight</p>
      <p class="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
        {{ formatDecimalHours(statistics.avg_flight_hours) }}
      </p>
    </article>
  </section>
</template>
