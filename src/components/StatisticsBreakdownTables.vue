<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { DeepReadonly } from 'vue'
import { updateProfile } from '@/api/profile'
import { formatDecimalHours } from '@/lib/duration'
import type { Statistics } from '@/types'

const props = defineProps<{
  statistics: DeepReadonly<Statistics>
  initialAircraftGrouping?: AircraftGrouping
}>()

type AircraftGrouping = 'glider' | 'registration'

const aircraftGrouping = ref<AircraftGrouping>(props.initialAircraftGrouping ?? 'glider')
const aircraftGroupingMenuOpen = ref(false)
const aircraftGroupingMenuRef = ref<HTMLElement | null>(null)
const aircraftGroupingOptions: Array<{ value: AircraftGrouping; label: string }> = [
  { value: 'glider', label: 'glider' },
  { value: 'registration', label: 'registration' },
]
const aircraftRows = computed(() =>
  aircraftGrouping.value === 'registration'
    ? (props.statistics.flights_by_registration ?? [])
    : props.statistics.flights_by_glider,
)

function aircraftRowLabel(row: (typeof aircraftRows.value)[number]): string {
  return 'registration' in row && typeof row.registration === 'string'
    ? row.registration
    : row.glider
}

function selectAircraftGrouping(value: AircraftGrouping): void {
  aircraftGrouping.value = value
  aircraftGroupingMenuOpen.value = false
  void updateProfile({ preferences: { statistics_aircraft_grouping: value } })
}

function handleDocumentClick(event: MouseEvent): void {
  if (!aircraftGroupingMenuOpen.value || !aircraftGroupingMenuRef.value) return
  const target = event.target
  if (target instanceof Node && !aircraftGroupingMenuRef.value.contains(target)) {
    aircraftGroupingMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onUnmounted(() => document.removeEventListener('click', handleDocumentClick))

function zebraRowClass(index: number): string {
  return index % 2 === 1 ? 'bg-slate-50' : ''
}
</script>

<template>
  <section class="grid gap-4 lg:grid-cols-2">
    <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div class="flex items-center gap-2">
        <h2 class="font-semibold text-slate-900">By</h2>
        <span ref="aircraftGroupingMenuRef" class="relative inline-flex">
          <button
            type="button"
            class="inline-flex items-center gap-0.5 rounded font-semibold text-slate-900 transition hover:text-slate-700"
            :aria-expanded="aircraftGroupingMenuOpen"
            aria-haspopup="listbox"
            @click.stop="aircraftGroupingMenuOpen = !aircraftGroupingMenuOpen"
          >
            {{ aircraftGrouping === 'registration' ? 'registration' : 'glider' }}
            <svg
              class="h-4 w-4 shrink-0 text-slate-500 transition-transform"
              :class="aircraftGroupingMenuOpen ? 'rotate-180' : ''"
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
            v-if="aircraftGroupingMenuOpen"
            class="absolute left-0 top-full z-10 mt-1 min-w-[8.5rem] rounded-md border border-slate-200 bg-white py-1 shadow-lg"
            role="listbox"
            aria-label="Group aircraft statistics by"
          >
            <button
              v-for="option in aircraftGroupingOptions"
              :key="option.value"
              type="button"
              role="option"
              class="block w-full px-3 py-1.5 text-left text-sm transition hover:bg-slate-50"
              :class="
                option.value === aircraftGrouping
                  ? 'bg-sky-50 font-medium text-sky-900'
                  : 'text-slate-700'
              "
              :aria-selected="option.value === aircraftGrouping"
              @click="selectAircraftGrouping(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </span>
      </div>
      <p v-if="!aircraftRows.length" class="mt-4 text-sm text-slate-500">
        No flights in this period.
      </p>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-slate-200 text-slate-500">
            <tr>
              <th class="px-3 py-2 font-medium">
                {{ aircraftGrouping === 'registration' ? 'Registration' : 'Glider' }}
              </th>
              <th v-if="aircraftGrouping === 'registration'" class="px-3 py-2 font-medium">
                Glider
              </th>
              <th class="px-3 py-2 font-medium">Flights</th>
              <th class="px-3 py-2 font-medium">Hours</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in aircraftRows"
              :key="aircraftRowLabel(row)"
              :class="zebraRowClass(index)"
            >
              <td class="px-3 py-2 font-medium text-slate-900">{{ aircraftRowLabel(row) }}</td>
              <td
                v-if="aircraftGrouping === 'registration'"
                class="px-3 py-2 font-medium text-slate-900"
              >
                {{ row.glider }}
              </td>
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
