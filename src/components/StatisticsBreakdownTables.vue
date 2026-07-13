<script setup lang="ts">
import type { DeepReadonly } from 'vue'
import { formatDecimalHours } from '@/lib/duration'
import type { Statistics } from '@/types'

defineProps<{
  statistics: DeepReadonly<Statistics>
}>()

function zebraRowClass(index: number): string {
  return index % 2 === 1 ? 'bg-slate-50' : ''
}
</script>

<template>
  <section class="grid gap-4 lg:grid-cols-2">
    <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 class="font-semibold text-slate-900">By glider</h2>
      <p v-if="!statistics.flights_by_glider.length" class="mt-4 text-sm text-slate-500">
        No flights in this period.
      </p>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-slate-200 text-slate-500">
            <tr>
              <th class="px-3 py-2 font-medium">Glider</th>
              <th class="px-3 py-2 font-medium">Flights</th>
              <th class="px-3 py-2 font-medium">Hours</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in statistics.flights_by_glider"
              :key="row.glider"
              :class="zebraRowClass(index)"
            >
              <td class="px-3 py-2 font-medium text-slate-900">{{ row.glider }}</td>
              <td class="px-3 py-2 tabular-nums text-slate-700">{{ row.count }}</td>
              <td class="px-3 py-2 tabular-nums text-slate-700">{{ formatDecimalHours(row.hours) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 class="font-semibold text-slate-900">By launch type</h2>
      <p v-if="!statistics.flights_by_launch_type.length" class="mt-4 text-sm text-slate-500">
        No flights in this period.
      </p>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-slate-200 text-slate-500">
            <tr>
              <th class="px-3 py-2 font-medium">Launch type</th>
              <th class="px-3 py-2 font-medium">Flights</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in statistics.flights_by_launch_type"
              :key="row.launch_type"
              :class="zebraRowClass(index)"
            >
              <td class="px-3 py-2 font-medium text-slate-900">{{ row.launch_type }}</td>
              <td class="px-3 py-2 tabular-nums text-slate-700">{{ row.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>
