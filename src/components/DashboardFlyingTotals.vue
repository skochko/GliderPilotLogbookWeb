<script setup lang="ts">
import { computed } from 'vue'
import type { DeepReadonly } from 'vue'
import { formatDecimalHours } from '@/lib/duration'
import type { Statistics } from '@/types'

const props = defineProps<{
  statistics: DeepReadonly<Statistics>
}>()

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
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:p-4">
    <h2 class="text-sm font-medium text-slate-500">Your flying</h2>
    <dl class="mt-2">
      <div
        v-for="row in rows"
        :key="row.key"
        class="flex items-baseline justify-between gap-4"
        :class="
          row.key === 'total'
            ? 'border-b border-slate-100 pb-2.5 pt-0'
            : 'py-1 pl-2'
        "
      >
        <dt class="flex min-w-0 items-center gap-2">
          <span
            v-if="row.badgeClass"
            class="inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset"
            :class="row.badgeClass"
          >
            {{ row.label }}
          </span>
          <span v-else class="text-sm font-medium text-slate-700">{{ row.label }}</span>
        </dt>
        <dd class="text-right">
          <p
            class="tabular-nums text-slate-900"
            :class="
              row.key === 'total'
                ? 'text-lg font-semibold md:text-xl'
                : 'text-sm font-medium text-slate-800 md:text-base'
            "
          >
            {{ formatDecimalHours(row.hours) }}
          </p>
          <p
            v-if="row.countLabel"
            class="text-slate-500"
            :class="row.key === 'total' ? 'text-xs' : 'text-[11px]'"
          >
            {{ row.count }} {{ row.countLabel }}
          </p>
        </dd>
      </div>
    </dl>
  </section>
</template>
