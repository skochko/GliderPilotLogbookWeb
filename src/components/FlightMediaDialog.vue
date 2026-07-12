<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import IgcMapDialog from '@/components/IgcMapDialog.vue'
import SpinnerIcon from '@/components/SpinnerIcon.vue'
import { listFlightMedia } from '@/api/flightMedia'
import { isApiError } from '@/api/errors'
import { mediaTypeLabel } from '@/lib/mediaTags'
import type { FlightMediaItem } from '@/types'

const props = defineProps<{
  open: boolean
  flightId: string | null
}>()

const emit = defineEmits<{
  close: []
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const items = ref<FlightMediaItem[]>([])
const igcMapOpen = ref(false)
const igcFilename = ref<string | null>(null)
const igcLabel = ref<string | null>(null)

const hasItems = computed(() => items.value.length > 0)

function openIgcMap(item: FlightMediaItem): void {
  if (!props.flightId) {
    return
  }
  igcFilename.value = item.filename
  igcLabel.value = item.label
  igcMapOpen.value = true
}

function closeIgcMap(): void {
  igcMapOpen.value = false
  igcFilename.value = null
  igcLabel.value = null
}

async function loadMedia(): Promise<void> {
  if (!props.flightId) {
    return
  }
  loading.value = true
  error.value = null
  try {
    items.value = await listFlightMedia(props.flightId)
  } catch (err) {
    error.value = isApiError(err) ? err.message : 'Failed to load media'
    items.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.open, props.flightId] as const,
  ([open, flightId]) => {
    if (open && flightId) {
      void loadMedia()
    } else {
      closeIgcMap()
    }
  },
)
</script>

<template>
  <dialog
    v-if="open"
    open
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl">
      <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 class="text-lg font-semibold text-slate-900">Flight media</h2>
        <button
          type="button"
          class="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
          @click="emit('close')"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-4 px-5 py-4">
        <ErrorBanner v-if="error" :message="error" :retry-busy="loading" @retry="loadMedia" />

        <div v-if="loading" class="flex items-center gap-2 text-sm text-slate-500">
          <SpinnerIcon class="h-4 w-4" />
          Loading media…
        </div>

        <p v-else-if="!hasItems" class="text-sm text-slate-500">No media attached to this flight.</p>

        <ul v-else class="space-y-3">
          <li
            v-for="item in items"
            :key="`${item.type}:${item.filename}`"
            class="rounded-md border border-slate-200 px-3 py-2"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {{ mediaTypeLabel(item.type) }}
                </p>
                <p class="truncate text-sm font-medium text-slate-900" :title="item.filename">
                  {{ item.label }}
                </p>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-1">
                <button
                  v-if="item.type === 'igc'"
                  type="button"
                  class="text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline"
                  @click="openIgcMap(item)"
                >
                  View on map
                </button>
                <a
                  v-if="item.drive_url"
                  :href="item.drive_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline"
                >
                  Open in Drive
                </a>
                <span v-else-if="item.type !== 'igc'" class="text-xs text-slate-400">Not found on Drive</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </dialog>

  <IgcMapDialog
    :open="igcMapOpen"
    :flight-id="flightId"
    :filename="igcFilename"
    :label="igcLabel"
    @close="closeIgcMap"
  />
</template>
