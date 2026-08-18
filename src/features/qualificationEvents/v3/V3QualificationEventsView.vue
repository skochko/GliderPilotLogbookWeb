<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import AirfieldAutocomplete from '@/components/AirfieldAutocomplete.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import FormSheetLayout from '@/components/FormSheetLayout.vue'
import LoadingState from '@/components/LoadingState.vue'
import { getQualificationEvents, updateQualificationEvents } from '@/api/qualificationEvents'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { QUALIFICATION_EVENT_TYPES, type QualificationEvent } from '@/types/qualificationEvents'

const { show } = useFlashMessage()
const events = ref<QualificationEvent[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const editingEvent = ref<QualificationEvent | null>(null)
const editingIndex = ref<number | null>(null)
const deleteIndex = ref<number | null>(null)

onMounted(loadEvents)

async function loadEvents(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    events.value = (await getQualificationEvents()).events
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not load qualification events.'
  } finally {
    loading.value = false
  }
}

function newEvent(): QualificationEvent {
  return {
    date: '',
    place: '',
    event_type: QUALIFICATION_EVENT_TYPES[0],
    date_completed: '',
    remarks: '',
  }
}

function openCreate(): void {
  editingIndex.value = null
  editingEvent.value = newEvent()
}

function openEdit(index: number): void {
  const event = events.value[index]
  if (!event) return
  editingIndex.value = index
  editingEvent.value = { ...event }
}

function closeEditor(): void {
  if (!saving.value) {
    editingEvent.value = null
    editingIndex.value = null
  }
}

async function saveEvent(): Promise<void> {
  if (!editingEvent.value) return
  const next = [...events.value]
  if (editingIndex.value === null) {
    next.push(editingEvent.value)
  } else {
    next[editingIndex.value] = editingEvent.value
  }
  await saveEvents(next)
  if (!error.value) closeEditor()
}

async function saveEvents(nextEvents: QualificationEvent[]): Promise<void> {
  saving.value = true
  error.value = null
  try {
    const compatibleEvents = nextEvents.map((event) => ({
      ...event,
      date: event.date_completed,
    }))
    events.value = (await updateQualificationEvents(compatibleEvents)).events
    show('Qualification events saved.', 'success')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not save qualification events.'
  } finally {
    saving.value = false
  }
}

function requestDelete(index: number): void {
  deleteIndex.value = index
}

async function confirmDelete(): Promise<void> {
  if (deleteIndex.value === null) return
  const next = events.value.filter((_, index) => index !== deleteIndex.value)
  deleteIndex.value = null
  await saveEvents(next)
}

function formatEventDate(value: string): string {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  const monthName = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][Number(month) - 1]
  return monthName ? `${day}-${monthName}-${year}` : value
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Training &amp; Qualification Events</h1>
        <p class="mt-1 text-slate-600">Keep a record of your training and qualification events.</p>
      </div>
      <ActionButton :disabled="loading" @click="openCreate">Add event</ActionButton>
    </div>

    <LoadingState v-if="loading" />
    <ErrorBanner v-else-if="error" :message="error" :retry-busy="loading" @retry="loadEvents" />
    <section v-else class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div v-if="!events.length" class="p-6 text-sm text-slate-600">
        No events recorded yet. Add your first event to get started.
      </div>
      <template v-else>
        <div class="divide-y divide-slate-100 md:hidden">
          <article v-for="(event, index) in events" :key="event.id ?? index" class="p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="font-medium text-slate-800">{{ event.event_type }}</h2>
                <p class="mt-1 text-sm text-slate-600">
                  {{ formatEventDate(event.date_completed) }}
                  <span aria-hidden="true"> · </span>
                  {{ event.place || '—' }}
                </p>
              </div>
            </div>
            <p v-if="event.remarks" class="mt-3 text-sm text-slate-600">{{ event.remarks }}</p>
            <div class="mt-4 flex gap-2">
              <button
                type="button"
                class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                @click="openEdit(index)"
              >
                Edit
              </button>
              <button
                type="button"
                class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                @click="requestDelete(index)"
              >
                Delete
              </button>
            </div>
          </article>
        </div>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[760px] text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Event type</th>
                <th class="px-4 py-3">Date completed</th>
                <th class="px-4 py-3">Place</th>
                <th class="px-4 py-3">Notes</th>
                <th class="px-4 py-3"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(event, index) in events" :key="event.id ?? index">
                <td class="px-4 py-3 font-medium text-slate-800">{{ event.event_type }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-slate-600">
                  {{ formatEventDate(event.date_completed) }}
                </td>
                <td class="px-4 py-3 text-slate-600">{{ event.place || '—' }}</td>
                <td class="max-w-xs truncate px-4 py-3 text-slate-600">
                  {{ event.remarks || '—' }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      class="rounded-md p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                      aria-label="Edit event"
                      title="Edit event"
                      @click="openEdit(index)"
                    >
                      <svg
                        class="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="m16.862 4.487 2.651 2.651M4 20h4l10.5-10.5a1.875 1.875 0 0 0-2.65-2.65L5.35 17.35 4 20Z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
                      aria-label="Delete event"
                      title="Delete event"
                      @click="requestDelete(index)"
                    >
                      <svg
                        class="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M6 7h12m-9 0V5h6v2m-8 0 .7 12.2A2 2 0 0 0 9.7 21h4.6a2 2 0 0 0 1.999-1.8L17 7M10 11v6m4-6v6"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>

    <div v-if="editingEvent" class="fixed inset-0 z-40 sm:p-6">
      <div
        class="h-full bg-white shadow-xl sm:mx-auto sm:max-w-2xl sm:rounded-xl sm:ring-1 sm:ring-slate-200"
      >
        <FormSheetLayout
          title="Edit qualification event"
          subtitle="Update the event details"
          :back-disabled="saving"
          :show-desktop-close="true"
          @back="closeEditor"
        >
          <form class="space-y-4" @submit.prevent="saveEvent">
            <label class="block text-sm">
              <span class="font-medium text-slate-700">Event type</span>
              <select v-model="editingEvent.event_type" class="field-control mt-1">
                <option v-for="type in QUALIFICATION_EVENT_TYPES" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </label>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">Date completed</span>
              <input v-model="editingEvent.date_completed" type="date" class="field-control mt-1" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">Place</span>
              <AirfieldAutocomplete
                v-model="editingEvent.place"
                list-id="qualification-event-place-options"
              />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">Notes</span>
              <textarea v-model="editingEvent.remarks" rows="4" class="field-control mt-1" />
            </label>
          </form>
          <template #footer>
            <ActionButton variant="secondary" :disabled="saving" @click="closeEditor">
              Cancel
            </ActionButton>
            <ActionButton :busy="saving" @click="saveEvent">Save event</ActionButton>
          </template>
        </FormSheetLayout>
      </div>
    </div>

    <ConfirmDialog
      :open="deleteIndex !== null"
      title="Delete event?"
      message="This event will be removed from your logbook."
      confirm-label="Delete"
      :busy="saving"
      @confirm="confirmDelete"
      @cancel="deleteIndex = null"
    />
  </div>
</template>
