<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatDisplayDate } from '@/lib/dates'
import { formatDurationDisplay } from '@/lib/duration'
import type { ClubInstructor } from '@/types/instructorOversight'

type InstructorFilter = 'all' | 'attention' | 'current'
type InstructorView = 'list' | 'table'

const VIEW_STORAGE_KEY = 'club-instructors-view'
const props = defineProps<{
  instructors: readonly ClubInstructor[]
  downloadingProfileId: number | null
}>()
const emit = defineEmits<{
  download: [instructor: ClubInstructor]
  select: [instructor: ClubInstructor]
}>()

function initialView(): InstructorView {
  if (typeof window === 'undefined') return 'list'
  try {
    const savedView = window.localStorage.getItem(VIEW_STORAGE_KEY)
    return savedView === 'list' || savedView === 'table' ? savedView : 'list'
  } catch {
    return 'list'
  }
}

const searchQuery = ref('')
const activeFilter = ref<InstructorFilter>('all')
const activeView = ref<InstructorView>(initialView())
const expandedInstructorIds = ref(new Set<number>())
const filterOptions: ReadonlyArray<{
  value: InstructorFilter
  label: string
}> = [
  { value: 'all', label: 'All' },
  { value: 'attention', label: 'Needs attention' },
  { value: 'current', label: 'Current' },
]
const viewOptions: ReadonlyArray<{
  value: InstructorView
  label: string
  controls: string
}> = [
  { value: 'list', label: 'List', controls: 'instructor-list' },
  { value: 'table', label: 'Table', controls: 'instructor-table' },
]

watch(activeView, (view) => {
  try {
    window.localStorage.setItem(VIEW_STORAGE_KEY, view)
  } catch {
    // The selected view still works for the current session.
  }
})

function needsAttention(instructor: ClubInstructor): boolean {
  return (
    instructor.data_status !== 'current' ||
    !instructor.training_flights.is_current ||
    !instructor.refresher_renewal_date ||
    !instructor.demonstration_of_ability_date
  )
}

const sortedInstructors = computed(() =>
  [...props.instructors].sort((left, right) => {
    const rank = (instructor: ClubInstructor): number => {
      if (instructor.data_status === 'incomplete') return 0
      if (instructor.data_status === 'stale') return 1
      if (needsAttention(instructor)) return 2
      return 3
    }
    const rankDifference = rank(left) - rank(right)
    return rankDifference || left.instructor_name.localeCompare(right.instructor_name)
  }),
)
const attentionCount = computed(() => props.instructors.filter(needsAttention).length)
const currentCount = computed(() => props.instructors.length - attentionCount.value)
function filterCount(filter: InstructorFilter): number {
  if (filter === 'attention') return attentionCount.value
  if (filter === 'current') return currentCount.value
  return props.instructors.length
}
const visibleInstructors = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return sortedInstructors.value.filter((instructor) => {
    const matchesQuery = `${instructor.instructor_name} ${instructor.rating}`
      .toLocaleLowerCase()
      .includes(query)
    if (!matchesQuery) return false
    if (activeFilter.value === 'attention') return needsAttention(instructor)
    if (activeFilter.value === 'current') return !needsAttention(instructor)
    return true
  })
})

function value(valueToFormat: string | number | null): string | number {
  return valueToFormat ?? '—'
}
function toggleExpanded(profileId: number): void {
  const ids = new Set(expandedInstructorIds.value)
  if (ids.has(profileId)) ids.delete(profileId)
  else ids.add(profileId)
  expandedInstructorIds.value = ids
}
function statusLabel(instructor: ClubInstructor): string {
  if (instructor.data_status === 'stale') return 'Stale data'
  if (instructor.data_status !== 'current') return 'Missing data'
  if (needsAttention(instructor)) return 'Action required'
  return 'Current'
}
function statusTone(instructor: ClubInstructor): string {
  if (instructor.data_status === 'stale') return 'text-amber-700'
  return needsAttention(instructor) ? 'text-red-700' : 'text-emerald-700'
}
function statusMark(instructor: ClubInstructor): string {
  if (instructor.data_status === 'stale') return '◷'
  return needsAttention(instructor) ? '!' : '✓'
}
function trainingStatus(instructor: ClubInstructor): string {
  const training = instructor.training_flights
  if (!training.events.length) return 'No flights recorded'
  if (!training.is_current) return 'Not current'
  return remainingDaysLabel(training.remaining_days)
}
function remainingDaysLabel(days: number | null): string {
  if (days === null) return '—'
  if (days <= 0) return 'Expired'
  return `${days} day${days === 1 ? '' : 's'} left`
}
function dateValue(date: string | null): string {
  return date ? formatDisplayDate(date) : 'Not recorded'
}
function instructorCountLabel(count: number): string {
  return `${count} instructor${count === 1 ? '' : 's'}`
}
</script>

<template>
  <section aria-label="Instructor overview">
    <label class="sr-only" for="instructor-search">Search instructors</label>
    <input
      id="instructor-search"
      v-model="searchQuery"
      type="search"
      class="field-control mt-0 h-[38px]"
      placeholder="Search instructors"
    />

    <nav class="mt-2 flex gap-1.5 overflow-x-auto pb-1" aria-label="Instructor status">
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        class="min-h-9 shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        :class="
          activeFilter === option.value
            ? 'border-sky-800 bg-sky-800 text-white'
            : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
        "
        :aria-pressed="activeFilter === option.value"
        :data-filter="option.value"
        @click="activeFilter = option.value"
      >
        {{ option.label }} {{ filterCount(option.value) }}
      </button>
    </nav>

    <div class="my-2 flex items-center justify-between gap-2">
      <p class="text-xs text-slate-500" aria-live="polite">
        {{ instructorCountLabel(visibleInstructors.length) }}
      </p>
      <div
        class="flex overflow-hidden rounded-md border border-slate-300 bg-white"
        role="group"
        aria-label="View"
      >
        <button
          v-for="option in viewOptions"
          :key="option.value"
          type="button"
          class="min-h-9 border-l border-slate-300 px-3 py-1.5 text-xs font-medium transition first:border-l-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500"
          :class="
            activeView === option.value
              ? 'bg-sky-800 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          "
          :aria-pressed="activeView === option.value"
          :aria-controls="option.controls"
          :data-view="option.value"
          @click="activeView = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div
      v-show="activeView === 'list'"
      id="instructor-list"
      class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <p v-if="!visibleInstructors.length" class="px-4 py-8 text-center text-sm text-slate-500">
        No instructors found
      </p>
      <article
        v-for="(instructor, index) in visibleInstructors"
        :key="instructor.profile_id"
        class="border-t border-slate-200 first:border-t-0"
        :class="index % 2 === 1 ? 'bg-[var(--sheet-zebra-color)]' : 'bg-white'"
      >
        <button
          type="button"
          class="relative block min-h-[58px] w-full px-3 py-2.5 pr-9 text-left text-slate-900 transition hover:bg-sky-50/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500"
          :aria-expanded="expandedInstructorIds.has(instructor.profile_id)"
          :aria-controls="`instructor-summary-${instructor.profile_id}`"
          @click="toggleExpanded(instructor.profile_id)"
        >
          <span class="flex min-w-0 items-baseline gap-2">
            <span class="truncate text-sm font-semibold sm:text-base">
              {{ instructor.instructor_name }}
            </span>
            <span class="shrink-0 text-xs text-slate-500">{{ instructor.rating }}</span>
          </span>
          <span class="mt-0.5 block text-xs" :class="statusTone(instructor)">
            <span class="font-bold" aria-hidden="true">{{ statusMark(instructor) }}</span>
            {{ statusLabel(instructor) }}
            <span v-if="instructor.training_flights.remaining_days !== null" class="text-slate-600">
              · {{ remainingDaysLabel(instructor.training_flights.remaining_days) }}
            </span>
          </span>
          <svg
            class="absolute right-3 top-5 h-4 w-4 text-slate-500 transition"
            :class="expandedInstructorIds.has(instructor.profile_id) ? 'rotate-180' : ''"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        <div
          v-show="expandedInstructorIds.has(instructor.profile_id)"
          :id="`instructor-summary-${instructor.profile_id}`"
          class="px-3 pb-3 text-xs text-slate-600"
        >
          <p class="mb-1.5 tabular-nums">
            Activity:
            <strong class="font-medium text-slate-900">
              {{ formatDurationDisplay(instructor.fi_time) }} / 30h
            </strong>
            or
            <strong class="font-medium text-slate-900">
              {{ value(instructor.fi_launches) }} / 60 launches
            </strong>
          </p>
          <dl>
            <div class="flex justify-between gap-3 border-t border-slate-200/70 py-1.5">
              <dt>Training with FI(S)</dt>
              <dd class="text-right font-medium text-slate-800">
                {{ trainingStatus(instructor) }}
              </dd>
            </div>
            <div class="flex justify-between gap-3 border-t border-slate-200/70 py-1.5">
              <dt>Refresher renewal</dt>
              <dd class="text-right font-medium text-slate-800">
                {{ dateValue(instructor.refresher_renewal_date) }}
              </dd>
            </div>
            <div class="flex justify-between gap-3 border-t border-slate-200/70 py-1.5">
              <dt>Demonstration of ability</dt>
              <dd class="text-right font-medium text-slate-800">
                {{ dateValue(instructor.demonstration_of_ability_date) }}
              </dd>
            </div>
          </dl>
          <p v-if="instructor.data_status_message" class="mt-1.5" :class="statusTone(instructor)">
            {{ instructor.data_status_message }}
          </p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-md bg-sky-700 px-3 py-1.5 font-medium text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              @click="emit('select', instructor)"
            >
              View full details
            </button>
            <button
              type="button"
              class="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              data-action="download"
              :disabled="!instructor.activity_report_url || downloadingProfileId !== null"
              @click="emit('download', instructor)"
            >
              {{ downloadingProfileId === instructor.profile_id ? 'Downloading…' : 'Download PDF' }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <div
      v-show="activeView === 'table'"
      id="instructor-table"
      class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      role="region"
      aria-label="Instructor comparison, scroll horizontally"
      tabindex="0"
    >
      <table class="w-full min-w-[920px] border-separate border-spacing-0 text-xs leading-[18px]">
        <thead>
          <tr class="text-left text-slate-700">
            <th
              scope="col"
              class="sticky left-0 z-20 w-[150px] min-w-[150px] max-w-[150px] bg-[var(--sheet-header-color)] px-3 py-2 font-medium shadow-[1px_0_var(--sheet-header-color)]"
            >
              Instructor
            </th>
            <th
              scope="col"
              class="whitespace-nowrap bg-[var(--sheet-header-color)] px-3 py-2 font-medium"
            >
              Status / days left
            </th>
            <th
              scope="col"
              class="whitespace-nowrap bg-[var(--sheet-header-color)] px-3 py-2 font-medium"
            >
              Activity · either target
            </th>
            <th
              scope="col"
              class="whitespace-nowrap bg-[var(--sheet-header-color)] px-3 py-2 font-medium"
            >
              Training with FI(S)
            </th>
            <th
              scope="col"
              class="whitespace-nowrap bg-[var(--sheet-header-color)] px-3 py-2 font-medium"
            >
              Refresher renewal
            </th>
            <th
              scope="col"
              class="whitespace-nowrap bg-[var(--sheet-header-color)] px-3 py-2 font-medium"
            >
              Demonstration
            </th>
            <th scope="col" class="bg-[var(--sheet-header-color)] px-3 py-2 text-right font-medium">
              Report
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!visibleInstructors.length">
            <td colspan="7" class="px-4 py-8 text-center text-slate-500">No instructors found</td>
          </tr>
          <tr
            v-for="(instructor, index) in visibleInstructors"
            :key="instructor.profile_id"
            class="group cursor-pointer focus:outline-none"
            tabindex="0"
            @click="emit('select', instructor)"
            @keydown.enter="emit('select', instructor)"
            @keydown.space.prevent="emit('select', instructor)"
          >
            <td
              class="sticky left-0 z-10 w-[150px] min-w-[150px] max-w-[150px] border-t border-slate-200 px-2.5 py-2 align-middle shadow-[1px_0_var(--sheet-header-color)] group-hover:bg-sky-50 group-focus:bg-sky-50"
              :class="index % 2 === 1 ? 'bg-[var(--sheet-zebra-color)]' : 'bg-white'"
            >
              <strong class="block truncate font-semibold text-slate-900">{{
                instructor.instructor_name
              }}</strong>
              <small class="block text-[11px] text-slate-500">{{ instructor.rating }}</small>
            </td>
            <td
              class="whitespace-nowrap border-t border-slate-200 px-2.5 py-2 align-middle group-hover:bg-sky-50 group-focus:bg-sky-50"
              :class="[
                index % 2 === 1 ? 'bg-[var(--sheet-zebra-color)]' : 'bg-white',
                statusTone(instructor),
              ]"
            >
              {{ statusLabel(instructor) }}
              <small class="block text-[11px] text-slate-500">{{
                remainingDaysLabel(instructor.training_flights.remaining_days)
              }}</small>
            </td>
            <td
              class="whitespace-nowrap border-t border-slate-200 px-2.5 py-2 align-middle tabular-nums group-hover:bg-sky-50 group-focus:bg-sky-50"
              :class="index % 2 === 1 ? 'bg-[var(--sheet-zebra-color)]' : 'bg-white'"
            >
              {{ formatDurationDisplay(instructor.fi_time) }} / 30h
              <small class="block text-[11px] text-slate-500"
                >OR {{ value(instructor.fi_launches) }} / 60 launches</small
              >
            </td>
            <td
              class="whitespace-nowrap border-t border-slate-200 px-2.5 py-2 align-middle group-hover:bg-sky-50 group-focus:bg-sky-50"
              :class="index % 2 === 1 ? 'bg-[var(--sheet-zebra-color)]' : 'bg-white'"
            >
              {{ trainingStatus(instructor) }}
              <small class="block text-[11px] text-slate-500"
                >{{ instructor.training_flights.obtained }} of
                {{ instructor.training_flights.required }} recorded</small
              >
            </td>
            <td
              class="whitespace-nowrap border-t border-slate-200 px-2.5 py-2 align-middle group-hover:bg-sky-50 group-focus:bg-sky-50"
              :class="index % 2 === 1 ? 'bg-[var(--sheet-zebra-color)]' : 'bg-white'"
            >
              {{ dateValue(instructor.refresher_renewal_date) }}
              <small class="block text-[11px] capitalize text-slate-500">{{
                instructor.refresher_source
                  ? `From ${instructor.refresher_source}`
                  : 'Source unknown'
              }}</small>
            </td>
            <td
              class="whitespace-nowrap border-t border-slate-200 px-2.5 py-2 align-middle group-hover:bg-sky-50 group-focus:bg-sky-50"
              :class="index % 2 === 1 ? 'bg-[var(--sheet-zebra-color)]' : 'bg-white'"
            >
              {{ dateValue(instructor.demonstration_of_ability_date) }}
            </td>
            <td
              class="border-t border-slate-200 px-2.5 py-2 text-right align-middle group-hover:bg-sky-50 group-focus:bg-sky-50"
              :class="index % 2 === 1 ? 'bg-[var(--sheet-zebra-color)]' : 'bg-white'"
            >
              <button
                type="button"
                class="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium whitespace-nowrap text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                data-action="download"
                :disabled="!instructor.activity_report_url || downloadingProfileId !== null"
                @click.stop="emit('download', instructor)"
              >
                {{ downloadingProfileId === instructor.profile_id ? 'Downloading…' : 'PDF' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="mt-2 text-xs text-slate-500">
      {{
        activeView === 'list'
          ? 'Tap an instructor for a summary'
          : 'Swipe horizontally · Instructor names stay visible'
      }}
    </p>
  </section>
</template>
