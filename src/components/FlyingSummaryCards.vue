<script setup lang="ts">
import { computed } from 'vue'
import type { DeepReadonly } from 'vue'
import DashboardFlyingTotals from '@/components/DashboardFlyingTotals.vue'
import { formatDecimalHours } from '@/lib/duration'
import { FLYING_TOTALS_BADGE_CLASS } from '@/lib/flyingTotalsRows'
import { useMeasurementUnits } from '@/composables/useMeasurementUnits'
import { formatDistanceValue } from '@/lib/measurementUnits'
import type { Statistics } from '@/types'

const props = defineProps<{
  statistics: DeepReadonly<Statistics>
  showMobile?: boolean
}>()

const { units } = useMeasurementUnits()

const desktopFlyingTotals = computed(() => {
  const items = [
    {
      label: 'Total time',
      hours: props.statistics.total_flight_hours,
      flights: props.statistics.total_flights,
    },
    {
      label: 'Total PIC',
      labelPrefix: 'Total',
      badgeLabel: 'PIC',
      badgeClass: 'bg-sky-100 text-sky-800 ring-sky-200',
      hours: props.statistics.total_pic_hours,
      flights: props.statistics.pic_flights,
    },
    {
      label: 'Total P2',
      labelPrefix: 'Total',
      badgeLabel: 'P2',
      badgeClass: 'bg-violet-100 text-violet-800 ring-violet-200',
      hours: props.statistics.total_p2_hours,
      flights: props.statistics.p2_flights,
    },
    {
      label: 'Total solo',
      labelPrefix: 'Total',
      badgeLabel: 'Solo',
      badgeClass: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
      hours: props.statistics.solo_hours,
      flights: props.statistics.solo_flights,
    },
  ]

  if (props.statistics.total_instructor_hours > 0 || props.statistics.instructor_flights > 0) {
    items.push({
      label: 'Total Instructor',
      labelPrefix: 'Total',
      badgeLabel: 'Instructor',
      badgeClass: 'bg-amber-100 text-amber-900 ring-amber-200',
      hours: props.statistics.total_instructor_hours,
      flights: props.statistics.instructor_flights,
    })
  }

  return items
})
</script>

<template>
  <DashboardFlyingTotals
    v-if="showMobile !== false"
    class="sm:hidden"
    :statistics="statistics"
    always-expanded
  />
  <article
    v-if="showMobile !== false && statistics.total_kms > 0"
    class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:hidden"
  >
    <p class="text-sm font-medium text-slate-500">Distance flown</p>
    <p class="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
      {{ formatDistanceValue(statistics.total_kms, units) }}
    </p>
  </article>

  <section
    class="hidden gap-3 sm:grid"
    :class="desktopFlyingTotals.length === 5 ? 'grid-cols-5' : 'grid-cols-4'"
  >
    <article
      v-for="item in desktopFlyingTotals"
      :key="item.label"
      class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <p
        class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        <template v-if="item.badgeLabel">
          <span>{{ item.labelPrefix }}</span>
          <span :class="[FLYING_TOTALS_BADGE_CLASS, item.badgeClass]">
            {{ item.badgeLabel }}
          </span>
        </template>
        <template v-else>{{ item.label }}</template>
      </p>
      <p class="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
        {{ formatDecimalHours(item.hours) }}
      </p>
      <p class="mt-1 text-sm tabular-nums text-slate-500">
        <span class="font-medium text-slate-700">{{ item.flights }}</span>
        {{ item.flights === 1 ? 'flight' : 'flights' }}
      </p>
    </article>
  </section>
</template>
