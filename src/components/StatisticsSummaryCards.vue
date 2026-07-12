<script setup lang="ts">
import type { DeepReadonly } from 'vue'
import { formatDecimalHours } from '@/lib/duration'
import type { Statistics } from '@/types'

defineProps<{
  statistics: DeepReadonly<Statistics>
}>()
</script>

<template>
  <!-- Mobile: single card like Dashboard "Your flying" -->
  <section class="sm:hidden">
    <article class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <h2 class="text-sm font-medium text-slate-500">Summary</h2>

      <div class="mt-2 space-y-2">
        <div class="flex items-baseline justify-between gap-4">
          <span class="text-sm font-medium text-slate-700">Flight time</span>
          <span class="text-right">
            <span class="block tabular-nums text-lg font-semibold text-slate-900">
              {{ formatDecimalHours(statistics.total_flight_hours) }}
            </span>
            <span class="block text-xs text-slate-500">
              {{ statistics.total_flights }}
              {{ statistics.total_flights === 1 ? 'flight' : 'flights' }}
            </span>
          </span>
        </div>

        <div class="flex items-baseline justify-between gap-4">
          <span class="text-sm font-medium text-slate-700">Launches</span>
          <span class="text-right tabular-nums text-sm font-medium text-slate-800">
            {{ statistics.total_launches }}
          </span>
        </div>
      </div>

      <div
        class="mt-2 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 pt-2 text-xs text-slate-500"
      >
        <span>
          {{ statistics.days_flown }}
          {{ statistics.days_flown === 1 ? 'day' : 'days' }} flown
        </span>
        <span>Avg flight {{ formatDecimalHours(statistics.avg_flight_hours) }}</span>
      </div>
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
