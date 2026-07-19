<script setup lang="ts">
import { computed } from 'vue'
import {
  applyFlightDatePreset,
  FLIGHT_DATE_PRESET_OPTIONS,
  FLIGHT_LIST_SORT_OPTIONS,
  FLIGHT_ROLE_FILTER_OPTIONS,
  type FlightListSortPreset,
} from '@/lib/flightListQuery'
import { launchTypeChipLabel } from '@/lib/launchTypes'
import type { FlightDatePresetId, FlightFilterOptions, FlightListFilters, FlightPilotRoleFilter } from '@/types'

const props = defineProps<{
  sortPreset: FlightListSortPreset
  filters: FlightListFilters
  filterOptions: FlightFilterOptions
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:sortPreset': [value: FlightListSortPreset]
  'update:filters': [value: FlightListFilters]
}>()

const datePreset = computed(() => props.filters.date_preset ?? 'all_time')

function updateFilter<K extends keyof FlightListFilters>(key: K, value: FlightListFilters[K]): void {
  emit('update:filters', { ...props.filters, [key]: value })
}

function onSortChange(event: Event): void {
  emit('update:sortPreset', (event.target as HTMLSelectElement).value as FlightListSortPreset)
}

function onDatePresetChange(preset: FlightDatePresetId): void {
  emit('update:filters', applyFlightDatePreset(props.filters, preset))
}

function onCustomDateChange(key: 'date_from' | 'date_to', value: string): void {
  emit('update:filters', {
    ...props.filters,
    date_preset: 'custom',
    [key]: value,
  })
}

function launchTypeLabel(value: string): string {
  return launchTypeChipLabel(value) || value
}
</script>

<template>
  <div class="space-y-5">
    <label class="block text-sm">
      <span class="font-medium text-slate-700">Sort by</span>
      <select
        :value="sortPreset"
        class="field-control mt-1"
        :disabled="loading"
        @change="onSortChange"
      >
        <option v-for="option in FLIGHT_LIST_SORT_OPTIONS" :key="option.id" :value="option.id">
          {{ option.label }}
        </option>
      </select>
    </label>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label class="block text-sm">
        <span class="font-medium text-slate-700">Glider</span>
        <select
          :value="filters.glider ?? ''"
          class="field-control mt-1"
          :disabled="loading"
          @change="updateFilter('glider', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">All gliders</option>
          <option v-for="option in filterOptions.gliders" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Registration</span>
        <select
          :value="filters.registration ?? ''"
          class="field-control mt-1"
          :disabled="loading"
          @change="updateFilter('registration', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">All registrations</option>
          <option v-for="option in filterOptions.registrations" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Launch type</span>
        <select
          :value="filters.launch_type ?? ''"
          class="field-control mt-1"
          :disabled="loading"
          @change="updateFilter('launch_type', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">All launch types</option>
          <option v-for="option in filterOptions.launch_types" :key="option" :value="option">
            {{ launchTypeLabel(option) }}
          </option>
        </select>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Role</span>
        <select
          :value="filters.role ?? ''"
          class="field-control mt-1"
          :disabled="loading"
          @change="updateFilter('role', ($event.target as HTMLSelectElement).value as FlightPilotRoleFilter)"
        >
          <option v-for="option in FLIGHT_ROLE_FILTER_OPTIONS" :key="option.value || 'all'" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <div>
      <h3 class="text-sm font-medium text-slate-700">Period</h3>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="option in FLIGHT_DATE_PRESET_OPTIONS"
          :key="option.id"
          type="button"
          class="rounded-full px-3 py-1.5 text-sm font-medium transition"
          :class="
            datePreset === option.id
              ? 'bg-sky-700 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          "
          :disabled="loading"
          @click="onDatePresetChange(option.id)"
        >
          {{ option.label }}
        </button>
      </div>

      <div
        v-if="datePreset === 'custom'"
        class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <label class="block text-sm">
          <span class="font-medium text-slate-700">From</span>
          <input
            :value="filters.date_from ?? ''"
            type="date"
            class="field-control mt-1"
            :disabled="loading"
            @input="onCustomDateChange('date_from', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="block text-sm">
          <span class="font-medium text-slate-700">To</span>
          <input
            :value="filters.date_to ?? ''"
            type="date"
            class="field-control mt-1"
            :disabled="loading"
            @input="onCustomDateChange('date_to', ($event.target as HTMLInputElement).value)"
          />
        </label>
      </div>
    </div>
  </div>
</template>
