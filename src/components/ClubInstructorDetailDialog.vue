<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { formatDisplayDate, formatDateTime } from '@/lib/dates'
import type { ClubInstructor } from '@/types/instructorOversight'

defineProps<{ open: boolean; instructor: ClubInstructor | null }>()
const emit = defineEmits<{ close: [] }>()

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

function dateValue(value: string | null): string {
  return value ? formatDisplayDate(value) : '—'
}

function dateTimeValue(value: string | null): string {
  return value ? formatDateTime(value) : '—'
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 bg-[#1A2640]/40"
      aria-hidden="true"
      @click.self="$emit('close')"
    />
    <div
      v-if="open && instructor"
      class="fixed inset-x-0 bottom-0 z-50 flex justify-center p-0 sm:inset-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructor-detail-title"
    >
      <div
        class="flex max-h-[min(88dvh,680px)] w-full max-w-lg flex-col overflow-hidden rounded-t-xl bg-white shadow-xl sm:rounded-xl"
      >
        <header class="shrink-0 border-b border-slate-200 px-4 py-4">
          <button
            type="button"
            class="float-right text-lg leading-none text-slate-400 transition hover:text-slate-600"
            aria-label="Close"
            @click="$emit('close')"
          >
            ✕
          </button>
          <h2 id="instructor-detail-title" class="pr-8 text-xl font-bold text-slate-900">
            {{ instructor.instructor_name }}
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            {{ instructor.rating }} · {{ instructor.activity_period_months }}-month activity period
          </p>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4">
          <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-slate-200 bg-white p-3">
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
                Data status
              </dt>
              <dd class="mt-1 font-semibold capitalize text-slate-900">
                {{ instructor.data_status }}
              </dd>
              <p v-if="instructor.data_status_message" class="mt-1 text-sm text-slate-600">
                {{ instructor.data_status_message }}
              </p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3">
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
                Logbook cache
              </dt>
              <dd class="mt-1 text-sm text-slate-900">
                Checked {{ dateTimeValue(instructor.cache_verified_at) }}
              </dd>
              <p class="mt-1 text-sm text-slate-500">
                Updated {{ dateTimeValue(instructor.cache_updated_at) }}
              </p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3">
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
                Reporting date
              </dt>
              <dd class="mt-1 text-sm font-semibold text-slate-900">
                {{ dateValue(instructor.reporting_date) }}
              </dd>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3">
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
                Refresher source
              </dt>
              <dd class="mt-1 text-sm font-semibold capitalize text-slate-900">
                {{ instructor.refresher_source ?? '—' }}
              </dd>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3 sm:col-span-2">
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
                Time and launch formula
              </dt>
              <dd class="mt-1 text-sm text-slate-700">{{ instructor.time_launch_note }}</dd>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3 sm:col-span-2">
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
                Refresher calculation
              </dt>
              <dd class="mt-1 text-sm text-slate-700">{{ instructor.refresher_note }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </Teleport>
</template>
