<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DeepReadonly } from 'vue'
import { formatDecimalHours } from '@/lib/duration'
import type { Statistics } from '@/types'

const props = defineProps<{
  statistics: DeepReadonly<Statistics>
}>()

const expanded = ref(false)

type FlyingRow = {
  key: string
  label: string
  hours: number
  count: number
  countLabel: string
  badgeClass?: string
}

const rows = computed((): FlyingRow[] => {
  const stats = props.statistics
  const items: FlyingRow[] = [
    {
      key: 'total',
      label: 'Total',
      hours: stats.total_flight_hours,
      count: stats.total_flights,
      countLabel: stats.total_flights === 1 ? 'flight' : 'flights',
    },
    {
      key: 'p1',
      label: 'P1',
      hours: stats.total_pic_hours,
      count: stats.pic_flights,
      countLabel: stats.pic_flights === 1 ? 'flight' : 'flights',
      badgeClass: 'bg-sky-100 text-sky-800 ring-sky-200',
    },
    {
      key: 'p2',
      label: 'P2',
      hours: stats.total_p2_hours,
      count: stats.p2_flights,
      countLabel: stats.p2_flights === 1 ? 'flight' : 'flights',
      badgeClass: 'bg-violet-100 text-violet-800 ring-violet-200',
    },
    {
      key: 'solo',
      label: 'Solo',
      hours: stats.solo_hours,
      count: stats.solo_flights,
      countLabel: stats.solo_flights === 1 ? 'flight' : 'flights',
      badgeClass: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    },
  ]

  if (stats.total_instructor_hours > 0 || stats.instructor_flights > 0) {
    items.push({
      key: 'instructor',
      label: 'Instructor',
      hours: stats.total_instructor_hours,
      count: stats.instructor_flights,
      countLabel: stats.instructor_flights === 1 ? 'flight' : 'flights',
      badgeClass: 'bg-amber-100 text-amber-900 ring-amber-200',
    })
  }

  return items
})

const summaryRows = computed(() =>
  rows.value.filter((row) => row.key === 'total' || row.key === 'solo'),
)

const breakdownRows = computed(() =>
  rows.value.filter((row) => row.key !== 'total' && row.key !== 'solo'),
)

function rowHoursClass(key: string): string {
  return key === 'total'
    ? 'text-lg font-semibold md:text-xl'
    : 'text-sm font-medium text-slate-800 md:text-base'
}

function rowCountClass(key: string): string {
  return key === 'total' ? 'text-xs' : 'text-[11px]'
}
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
