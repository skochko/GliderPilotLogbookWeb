<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import AirfieldAutocomplete from '@/components/AirfieldAutocomplete.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import FormSheetLayout from '@/components/FormSheetLayout.vue'
import LoadingState from '@/components/LoadingState.vue'
import { getQualificationEvents, updateQualificationEvents } from '@/api/qualificationEvents'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { QUALIFICATION_EVENT_TYPES, type QualificationEvent } from '@/types/qualificationEvents'
import { sortQualificationEventsNewestFirst } from '@/features/qualificationEvents/sort'

const { show } = useFlashMessage()
const events = ref<QualificationEvent[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const editingEvent = ref<QualificationEvent | null>(null)
const editingIndex = ref<number | null>(null)
const deleteIndex = ref<number | null>(null)
const actionsMenuIndex = ref<number | null>(null)
const editorTitle = computed(() =>
  editingIndex.value === null ? 'Add qualification event' : 'Edit qualification event',
)
const editorSubtitle = computed(() =>
  editingIndex.value === null
    ? 'Record a new training or qualification event'
    : 'Update the event details',
)
let previousBodyOverflow = ''
let bodyScrollLocked = false

onMounted(loadEvents)

watch(editingEvent, (event, previousEvent) => {
  if (event && !previousEvent) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    bodyScrollLocked = true
    return
  }
  if (!event && previousEvent) {
    document.body.style.overflow = previousBodyOverflow
    bodyScrollLocked = false
  }
})

onUnmounted(() => {
  if (bodyScrollLocked) document.body.style.overflow = previousBodyOverflow
})

async function loadEvents(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    events.value = sortQualificationEventsNewestFirst((await getQualificationEvents()).events)
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
  actionsMenuIndex.value = null
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
  if (await saveEvents(next)) closeEditor()
}

async function saveEvents(nextEvents: QualificationEvent[]): Promise<boolean> {
  saving.value = true
  error.value = null
  try {
    const compatibleEvents = sortQualificationEventsNewestFirst(nextEvents).map((event) => ({
      ...event,
      date: event.date_completed,
    }))
    events.value = sortQualificationEventsNewestFirst(
      (await updateQualificationEvents(compatibleEvents)).events,
    )
    show('Qualification events saved.', 'success')
    return true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not save qualification events.'
    return false
  } finally {
    saving.value = false
  }
}

function requestDelete(index: number): void {
  actionsMenuIndex.value = null
  deleteIndex.value = index
}

function requestEditorDelete(): void {
  if (editingIndex.value !== null) requestDelete(editingIndex.value)
}

function toggleActionsMenu(index: number): void {
  actionsMenuIndex.value = actionsMenuIndex.value === index ? null : index
}

async function confirmDelete(): Promise<void> {
  if (deleteIndex.value === null || saving.value) return
  const indexToDelete = deleteIndex.value
  const deletingEditedEvent = editingIndex.value === indexToDelete
  const next = events.value.filter((_, index) => index !== indexToDelete)
  if (await saveEvents(next)) {
    deleteIndex.value = null
    if (deletingEditedEvent) {
      editingEvent.value = null
      editingIndex.value = null
    }
  }
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
  <div class="space-y-6" @click="actionsMenuIndex = null">
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
        <div class="overflow-x-auto md:hidden">
          <table class="w-full table-fixed text-left text-sm">
            <thead class="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th class="w-20 px-2 py-2 font-medium">Date</th>
                <th class="w-40 px-2 py-2 font-medium">Event</th>
                <th class="px-2 py-2 font-medium">Notes</th>
                <th class="w-10 px-1 py-2"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(event, index) in events"
                :key="event.id ?? index"
                class="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50/70"
                @click="openEdit(index)"
              >
                <td
                  class="whitespace-nowrap px-2 py-2 align-top text-xs tabular-nums text-slate-600"
                >
                  {{ formatEventDate(event.date_completed) }}
                </td>
                <td class="min-w-0 px-2 py-2 align-top">
                  <p class="line-clamp-2 break-words font-medium text-slate-800">
                    {{ event.event_type }}
                  </p>
                  <p class="mt-0.5 truncate text-xs text-slate-500" :title="event.place">
                    {{ event.place || '—' }}
                  </p>
                </td>
                <td class="min-w-0 px-2 py-2 align-top text-slate-600">
                  <p class="truncate" :title="event.remarks">{{ event.remarks || '—' }}</p>
                </td>
                <td class="px-1 py-1.5 align-middle">
                  <div class="flex flex-col items-end" @click.stop>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      aria-label="Event actions"
                      title="Event actions"
                      :aria-expanded="actionsMenuIndex === index"
                      @click="toggleActionsMenu(index)"
                    >
                      <svg
                        class="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <circle cx="5" cy="12" r="1.75" />
                        <circle cx="12" cy="12" r="1.75" />
                        <circle cx="19" cy="12" r="1.75" />
                      </svg>
                    </button>
                    <div
                      v-if="actionsMenuIndex === index"
                      class="mt-1 w-24 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg"
                      role="menu"
                    >
                      <button
                        type="button"
                        class="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        role="menuitem"
                        @click="openEdit(index)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                        role="menuitem"
                        @click="requestDelete(index)"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
              <tr
                v-for="(event, index) in events"
                :key="event.id ?? index"
                class="cursor-pointer transition hover:bg-slate-50/70"
                @click="openEdit(index)"
              >
                <td class="px-4 py-3 font-medium text-slate-800">{{ event.event_type }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-slate-600">
                  {{ formatEventDate(event.date_completed) }}
                </td>
                <td class="px-4 py-3 text-slate-600">{{ event.place || '—' }}</td>
                <td class="max-w-xs truncate px-4 py-3 text-slate-600">
                  {{ event.remarks || '—' }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-col items-end" @click.stop>
                    <button
                      type="button"
                      class="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      aria-label="Event actions"
                      title="Event actions"
                      :aria-expanded="actionsMenuIndex === index"
                      @click="toggleActionsMenu(index)"
                    >
                      <svg
                        class="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <circle cx="5" cy="12" r="1.75" />
                        <circle cx="12" cy="12" r="1.75" />
                        <circle cx="19" cy="12" r="1.75" />
                      </svg>
                    </button>
                    <div
                      v-if="actionsMenuIndex === index"
                      class="mt-1 w-24 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg"
                      role="menu"
                    >
                      <button
                        type="button"
                        class="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        role="menuitem"
                        @click="openEdit(index)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                        role="menuitem"
                        @click="requestDelete(index)"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>

    <Teleport to="body">
      <div
        v-if="editingEvent"
        class="fixed inset-0 z-40 h-dvh overflow-hidden overscroll-none sm:p-6"
      >
        <div
          class="h-full w-full min-w-0 max-w-full overflow-hidden bg-white shadow-xl sm:mx-auto sm:max-w-2xl sm:rounded-xl sm:ring-1 sm:ring-slate-200"
        >
          <FormSheetLayout
            class="min-w-0"
            :title="editorTitle"
            :subtitle="editorSubtitle"
            :back-disabled="saving"
            :show-desktop-close="true"
            @back="closeEditor"
          >
            <form class="min-w-0 space-y-4" @submit.prevent="saveEvent">
              <ErrorBanner v-if="error" :message="error" />
              <label class="block text-sm">
                <span class="font-medium text-slate-700">Event type</span>
                <select
                  v-model="editingEvent.event_type"
                  class="field-control mt-1 block !w-[calc(100dvw-2rem)] min-w-0 max-w-full sm:!w-full"
                >
                  <option v-for="type in QUALIFICATION_EVENT_TYPES" :key="type" :value="type">
                    {{ type }}
                  </option>
                </select>
              </label>
              <label class="block text-sm">
                <span class="font-medium text-slate-700">Date completed</span>
                <input
                  v-model="editingEvent.date_completed"
                  type="date"
                  class="field-control mt-1 block !w-[calc(100dvw-2rem)] min-w-0 max-w-full sm:!w-full"
                />
              </label>
              <label class="block text-sm">
                <span class="font-medium text-slate-700">Place</span>
                <div class="w-[calc(100dvw-2rem)] min-w-0 max-w-full sm:w-full">
                  <AirfieldAutocomplete
                    v-model="editingEvent.place"
                    list-id="qualification-event-place-options"
                  />
                </div>
              </label>
              <label class="block text-sm">
                <span class="font-medium text-slate-700">Notes</span>
                <textarea
                  v-model="editingEvent.remarks"
                  rows="4"
                  class="field-control mt-1 block !w-[calc(100dvw-2rem)] min-w-0 max-w-full resize-y sm:!w-full"
                />
              </label>
            </form>
            <template #footer>
              <div class="flex !w-[calc(100dvw-2rem)] min-w-0 max-w-full flex-col gap-3 sm:!w-full">
                <div class="flex w-full min-w-0 gap-3 sm:justify-end">
                  <ActionButton
                    variant="secondary"
                    class="min-w-0 flex-1 sm:flex-none"
                    :disabled="saving"
                    @click="closeEditor"
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    class="min-w-0 flex-1 sm:flex-none"
                    :busy="saving"
                    @click="saveEvent"
                  >
                    Save event
                  </ActionButton>
                </div>
                <button
                  v-if="editingIndex !== null"
                  type="button"
                  class="w-full min-w-0 max-w-full rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="saving"
                  @click="requestEditorDelete"
                >
                  Delete event
                </button>
              </div>
            </template>
          </FormSheetLayout>
        </div>
      </div>
    </Teleport>

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
