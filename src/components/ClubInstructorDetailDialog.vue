<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { formatDisplayDate, formatDateTime } from '@/lib/dates'
import LoadingState from '@/components/LoadingState.vue'
import type {
  ClubInstructor,
  InstructorActivityDetail,
  InstructorActivityMetric,
} from '@/types/instructorOversight'

defineProps<{
  open: boolean
  instructor: ClubInstructor | null
  activityDetail: InstructorActivityDetail | null
  loading: boolean
  error: string | null
}>()
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

function metricValue(metric: InstructorActivityMetric | undefined): string {
  if (!metric) return '—'
  const hours = Math.floor(metric.minutes / 60)
  const minutes = String(metric.minutes % 60).padStart(2, '0')
  return `${hours} h ${minutes} min · ${metric.count} ${metric.count === 1 ? 'flight' : 'flights'}`
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
        class="flex max-h-[min(92dvh,820px)] w-full max-w-5xl flex-col overflow-hidden rounded-t-xl bg-white shadow-xl sm:rounded-xl"
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
            {{ activityDetail?.privilege ?? instructor.rating }}
          </p>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4">
          <LoadingState v-if="loading" label="Loading activity report…" />
          <div
            v-else-if="error"
            class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800"
          >
            {{ error }}
          </div>
          <div v-else-if="activityDetail" class="space-y-5">
            <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <div class="rounded-lg border border-slate-200 bg-white p-3">
                <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Generated
                </dt>
                <dd class="mt-1 text-sm font-semibold text-slate-900">
                  {{ dateValue(activityDetail.generated_on) }}
                </dd>
              </div>
              <div class="rounded-lg border border-slate-200 bg-white p-3">
                <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Medical</dt>
                <dd class="mt-1 text-sm font-semibold text-slate-900">
                  {{ activityDetail.medical.type }}
                </dd>
                <p class="mt-1 text-sm text-slate-500">
                  {{ dateValue(activityDetail.medical.expiry_date) }} ·
                  {{ activityDetail.medical.status }}
                </p>
              </div>
            </dl>

            <section>
              <h3 class="mb-2 text-base font-semibold text-slate-900">Flight activity</h3>
              <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table class="min-w-[760px] text-sm">
                  <thead class="bg-[var(--sheet-header-color)] text-slate-700">
                    <tr>
                      <th class="px-3 py-2 text-left font-medium">Flight role / category</th>
                      <th class="px-3 py-2 text-center font-medium">Last 36 months</th>
                      <th class="px-3 py-2 text-center font-medium">Last 24 months</th>
                      <th class="px-3 py-2 text-center font-medium">Last 12 months</th>
                      <th class="px-3 py-2 text-center font-medium">Last flight</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, index) in activityDetail.activity"
                      :key="row.key"
                      class="border-t border-slate-100"
                      :class="index % 2 === 1 ? 'bg-[var(--sheet-zebra-color)]' : ''"
                    >
                      <td
                        class="px-3 py-2"
                        :class="row.nested ? 'pl-7 text-slate-600' : 'font-semibold'"
                      >
                        {{ row.label }}
                      </td>
                      <td class="px-3 py-2 text-center tabular-nums">
                        {{ metricValue(row.periods['36']) }}
                      </td>
                      <td class="px-3 py-2 text-center tabular-nums">
                        {{ metricValue(row.periods['24']) }}
                      </td>
                      <td class="px-3 py-2 text-center tabular-nums">
                        {{ metricValue(row.periods['12']) }}
                      </td>
                      <td class="px-3 py-2 text-center whitespace-nowrap">
                        {{ dateValue(row.last_date) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 class="mb-2 text-base font-semibold text-slate-900">
                Training &amp; Qualification Events
              </h3>
              <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table class="min-w-[680px] text-sm">
                  <thead class="bg-[var(--sheet-header-color)] text-slate-700">
                    <tr>
                      <th class="px-3 py-2 text-left font-medium">Date completed</th>
                      <th class="px-3 py-2 text-left font-medium">Event type</th>
                      <th class="px-3 py-2 text-left font-medium">Place</th>
                      <th class="px-3 py-2 text-left font-medium">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!activityDetail.events.length">
                      <td colspan="4" class="px-3 py-6 text-center text-slate-500">
                        No training and qualification events recorded for this period.
                      </td>
                    </tr>
                    <tr
                      v-for="(event, index) in activityDetail.events"
                      :key="`${event.date}-${event.event_type}-${index}`"
                      class="border-t border-slate-100"
                      :class="index % 2 === 1 ? 'bg-[var(--sheet-zebra-color)]' : ''"
                    >
                      <td class="px-3 py-2 whitespace-nowrap">{{ dateValue(event.date) }}</td>
                      <td class="px-3 py-2">{{ event.event_type || '—' }}</td>
                      <td class="px-3 py-2">{{ event.place || '—' }}</td>
                      <td class="px-3 py-2">{{ event.remarks || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="mt-2 text-xs text-slate-500">
                Only events from the four years up to the reporting date are shown.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
