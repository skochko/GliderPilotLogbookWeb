<script setup lang="ts">
import { formatDisplayDate, formatDateTime } from '@/lib/dates'
import type { ClubInstructor } from '@/types/instructorOversight'

defineProps<{
  instructors: readonly ClubInstructor[]
  downloadingProfileId: number | null
}>()

defineEmits<{ download: [instructor: ClubInstructor] }>()

function value(value: string | number | null): string | number {
  return value ?? '—'
}

function statusClasses(status: string): string {
  if (status === 'current') return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
  if (status === 'stale') return 'bg-amber-50 text-amber-800 ring-amber-600/20'
  return 'bg-red-50 text-red-700 ring-red-600/20'
}
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
    <table class="min-w-[1160px] text-sm">
      <thead class="bg-[var(--sheet-header-color)] text-left text-slate-700">
        <tr>
          <th class="px-3 py-2 font-medium">Instructor</th>
          <th class="px-3 py-2 text-center font-medium">Rating</th>
          <th class="px-3 py-2 text-right font-medium">PIC time</th>
          <th class="px-3 py-2 text-right font-medium">PIC launches</th>
          <th class="px-3 py-2 text-right font-medium">FI time</th>
          <th class="px-3 py-2 text-right font-medium">FI launches</th>
          <th class="px-3 py-2 font-medium">Refresher renewal</th>
          <th class="px-3 py-2 font-medium">Demonstration of ability</th>
          <th class="min-w-56 px-3 py-2 font-medium">Time and launch formula</th>
          <th class="min-w-56 px-3 py-2 font-medium">Refresher</th>
          <th class="px-3 py-2 text-right font-medium">Report</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(instructor, index) in instructors"
          :key="instructor.profile_id"
          class="border-t border-slate-100 transition hover:bg-slate-50/70"
          :class="[
            index % 2 === 1 ? 'bg-[var(--sheet-zebra-color)]' : '',
            instructor.data_status === 'stale' ? 'border-l-2 border-l-amber-400' : '',
            !['current', 'stale'].includes(instructor.data_status)
              ? 'border-l-2 border-l-red-400'
              : '',
          ]"
        >
          <td class="px-3 py-2 align-top">
            <p class="font-medium text-slate-900">{{ instructor.instructor_name }}</p>
            <span
              class="mt-1 inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset"
              :class="statusClasses(instructor.data_status)"
              :title="instructor.data_status_message || undefined"
            >
              {{ instructor.data_status }}
            </span>
            <p v-if="instructor.cache_verified_at" class="mt-1 text-xs text-slate-500">
              Checked {{ formatDateTime(instructor.cache_verified_at) }}
            </p>
          </td>
          <td class="px-3 py-2 text-center align-top">
            <span
              class="inline-flex rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800 ring-1 ring-inset ring-sky-600/20"
            >
              {{ instructor.rating }}
            </span>
          </td>
          <td class="px-3 py-2 text-right align-top font-medium tabular-nums">
            {{ value(instructor.pic_time) }}
          </td>
          <td class="px-3 py-2 text-right align-top tabular-nums">
            {{ value(instructor.pic_launches) }}
          </td>
          <td class="px-3 py-2 text-right align-top font-medium tabular-nums">
            {{ value(instructor.fi_time) }}
          </td>
          <td class="px-3 py-2 text-right align-top tabular-nums">
            {{ value(instructor.fi_launches) }}
          </td>
          <td class="px-3 py-2 align-top whitespace-nowrap">
            {{
              instructor.refresher_renewal_date
                ? formatDisplayDate(instructor.refresher_renewal_date)
                : '—'
            }}
            <p v-if="instructor.refresher_source" class="mt-0.5 text-xs capitalize text-slate-500">
              From {{ instructor.refresher_source }}
            </p>
          </td>
          <td class="px-3 py-2 align-top whitespace-nowrap">
            {{
              instructor.demonstration_of_ability_date
                ? formatDisplayDate(instructor.demonstration_of_ability_date)
                : '—'
            }}
          </td>
          <td class="px-3 py-2 align-top text-xs leading-5 text-slate-600">
            {{ instructor.time_launch_note }}
          </td>
          <td class="px-3 py-2 align-top text-xs leading-5 text-slate-600">
            {{ instructor.refresher_note }}
            <p v-if="instructor.data_status_message" class="mt-1 text-amber-800">
              {{ instructor.data_status_message }}
            </p>
          </td>
          <td class="px-3 py-2 text-right align-top">
            <button
              type="button"
              class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium whitespace-nowrap text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!instructor.activity_report_url || downloadingProfileId !== null"
              @click="$emit('download', instructor)"
            >
              {{ downloadingProfileId === instructor.profile_id ? 'Downloading…' : 'Download PDF' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
