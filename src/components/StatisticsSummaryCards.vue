<script setup lang="ts">
import type { DeepReadonly } from 'vue'
import { formatDecimalHours } from '@/lib/duration'
import type { Statistics } from '@/types'

defineProps<{
  statistics: DeepReadonly<Statistics>
}>()
</script>

<template>
  <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
