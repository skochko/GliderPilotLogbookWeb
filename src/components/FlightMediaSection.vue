<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import IgcMapDialog from '@/components/IgcMapDialog.vue'
import FlightImageViewerDialog from '@/components/FlightImageViewerDialog.vue'
import UploadProgressBar from '@/components/UploadProgressBar.vue'
import {
  attachFlightMediaFromDrive,
  deleteFlightMedia,
  getFlightMediaFolder,
  uploadFlightMedia,
  type MediaUploadProgress,
} from '@/api/flightMedia'
import { isApiError } from '@/api/errors'
import { useGooglePicker } from '@/composables/useGooglePicker'
import { mediaTypeLabel } from '@/lib/mediaTags'
import { FLIGHT_MEDIA_MAX_FILES, FLIGHT_MEDIA_MAX_UPLOAD_BYTES } from '@/types/flightMedia'
import type { Flight, FlightMediaItem } from '@/types'

const props = defineProps<{
  flightId: string
  media?: readonly FlightMediaItem[]
}>()

const emit = defineEmits<{
  updated: [Flight]
  'busy-change': [boolean]
}>()

const { pickDriveFile } = useGooglePicker()

const uploading = ref(false)
const attaching = ref(false)
const deletingFilename = ref<string | null>(null)
const deleteCandidate = ref<FlightMediaItem | null>(null)
const actionsMenuFilename = ref<string | null>(null)
const error = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadFileName = ref<string | null>(null)
const uploadProgress = ref<MediaUploadProgress | null>(null)
const igcMapOpen = ref(false)
const igcFilename = ref<string | null>(null)
const igcLabel = ref<string | null>(null)
const imageViewerOpen = ref(false)
const imageFilename = ref<string | null>(null)
const imageLabel = ref<string | null>(null)

const busy = computed(() => uploading.value || attaching.value || deletingFilename.value !== null)
const mediaCount = computed(() => props.media?.length ?? 0)
const canAddMore = computed(() => mediaCount.value < FLIGHT_MEDIA_MAX_FILES)
const maxUploadLabel = `${FLIGHT_MEDIA_MAX_UPLOAD_BYTES / (1024 * 1024)} MB`

watch(busy, (value) => emit('busy-change', value), { immediate: true })

function openFilePicker(): void {
  fileInput.value?.click()
}

async function onFileSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || uploading.value || attaching.value) {
    return
  }
  if (file.size > FLIGHT_MEDIA_MAX_UPLOAD_BYTES) {
    error.value = `File is too large. In-app upload limit is ${maxUploadLabel}. Use Google Drive for larger files.`
    return
  }

  uploading.value = true
  error.value = null
  uploadFileName.value = file.name
  uploadProgress.value = { loaded: 0, total: file.size, percent: 0 }
  try {
    const result = await uploadFlightMedia(props.flightId, file, {
      onProgress: (progress) => {
        uploadProgress.value = progress
      },
    })
    emit('updated', result.flight as Flight)
  } catch (err) {
    error.value = isApiError(err) ? err.message : 'Upload failed'
  } finally {
    uploading.value = false
    uploadFileName.value = null
    uploadProgress.value = null
  }
}

async function openDriveFolder(): Promise<void> {
  error.value = null
  try {
    const folder = await getFlightMediaFolder(props.flightId)
    if (!folder.folder_url) {
      error.value = 'Could not open the Google Drive folder for this flight.'
      return
    }
    window.open(folder.folder_url, '_blank', 'noopener,noreferrer')
  } catch (err) {
    error.value = isApiError(err) ? err.message : 'Failed to open Google Drive folder'
  }
}

async function attachFromDrive(): Promise<void> {
  if (attaching.value || uploading.value || !canAddMore.value) {
    return
  }

  attaching.value = true
  error.value = null
  try {
    const picked = await pickDriveFile()
    if (!picked) {
      return
    }
    const result = await attachFlightMediaFromDrive(props.flightId, picked.id)
    emit('updated', result.flight as Flight)
  } catch (err) {
    error.value = isApiError(err) ? err.message : 'Failed to attach file from Google Drive'
  } finally {
    attaching.value = false
  }
}

function openIgcMap(item: FlightMediaItem): void {
  igcFilename.value = item.filename
  igcLabel.value = item.label
  igcMapOpen.value = true
}

function closeIgcMap(): void {
  igcMapOpen.value = false
  igcFilename.value = null
  igcLabel.value = null
}

function openImageViewer(item: FlightMediaItem): void {
  imageFilename.value = item.filename
  imageLabel.value = item.label
  imageViewerOpen.value = true
}

function closeImageViewer(): void {
  imageViewerOpen.value = false
  imageFilename.value = null
  imageLabel.value = null
}

function requestDelete(item: FlightMediaItem): void {
  if (busy.value) {
    return
  }
  actionsMenuFilename.value = null
  deleteCandidate.value = item
}

function toggleActionsMenu(item: FlightMediaItem): void {
  actionsMenuFilename.value = actionsMenuFilename.value === item.filename ? null : item.filename
}

async function confirmDelete(): Promise<void> {
  const item = deleteCandidate.value
  if (!item || busy.value) {
    return
  }

  deletingFilename.value = item.filename
  error.value = null
  try {
    const result = await deleteFlightMedia(props.flightId, item.filename)
    if (igcFilename.value === item.filename) {
      closeIgcMap()
    }
    if (imageFilename.value === item.filename) {
      closeImageViewer()
    }
    deleteCandidate.value = null
    emit('updated', result.flight as Flight)
  } catch (err) {
    error.value = isApiError(err) ? err.message : 'Failed to delete attachment'
  } finally {
    deletingFilename.value = null
  }
}
</script>

<template>
  <section id="media-attachments" class="space-y-3 border-t border-slate-200 pt-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-medium text-slate-900">Media attachments</h3>
        <p class="mt-0.5 text-xs text-slate-500">
          Up to {{ FLIGHT_MEDIA_MAX_FILES }} files per flight. In-app upload limit
          {{ maxUploadLabel }}.
        </p>
      </div>
      <span class="text-xs tabular-nums text-slate-500"
        >{{ mediaCount }}/{{ FLIGHT_MEDIA_MAX_FILES }}</span
      >
    </div>

    <ErrorBanner v-if="error" :message="error" @retry="error = null" />

    <UploadProgressBar
      v-if="uploading && uploadProgress && uploadFileName"
      :label="`Uploading ${uploadFileName}`"
      :percent="uploadProgress.percent"
      :loaded="uploadProgress.loaded"
      :total="uploadProgress.total"
    />

    <ul v-if="media?.length" class="space-y-2">
      <li
        v-for="item in media"
        :key="`${item.type}:${item.filename}`"
        class="relative flex items-start justify-between gap-3 rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-700"
      >
        <div class="min-w-0">
          <p class="truncate font-medium text-slate-900" :title="item.label">{{ item.label }}</p>
          <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span class="text-slate-500">{{ mediaTypeLabel(item.type) }}</span>
            <button
              v-if="item.type === 'igc'"
              type="button"
              class="font-medium text-sky-700 hover:text-sky-900 hover:underline"
              @click="openIgcMap(item)"
            >
              View on map
            </button>
            <button
              v-if="item.type === 'image'"
              type="button"
              class="font-medium text-sky-700 hover:text-sky-900 hover:underline"
              @click="openImageViewer(item)"
            >
              View
            </button>
          </div>
        </div>
        <div class="relative shrink-0">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Attachment actions"
            title="Attachment actions"
            :aria-expanded="actionsMenuFilename === item.filename"
            :disabled="busy"
            @click="toggleActionsMenu(item)"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="1.75" />
              <circle cx="12" cy="12" r="1.75" />
              <circle cx="19" cy="12" r="1.75" />
            </svg>
          </button>
          <div
            v-if="actionsMenuFilename === item.filename"
            class="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg"
            role="menu"
          >
            <button
              type="button"
              class="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
              role="menuitem"
              @click="requestDelete(item)"
            >
              Delete attachment
            </button>
          </div>
        </div>
      </li>
    </ul>

    <div class="flex flex-wrap gap-2">
      <ActionButton :busy="uploading" :disabled="!canAddMore || attaching" @click="openFilePicker">
        <span aria-hidden="true">+</span>
        Upload file
      </ActionButton>
      <ActionButton
        variant="secondary"
        :busy="attaching"
        :disabled="!canAddMore || uploading"
        @click="attachFromDrive"
      >
        Attach from Drive
      </ActionButton>
      <button
        type="button"
        class="inline-flex items-center gap-1 px-1 py-2 text-sm font-medium text-slate-600 transition hover:text-sky-800 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="uploading || attaching || deletingFilename !== null"
        @click="openDriveFolder"
      >
        Open Drive folder
        <span aria-hidden="true">↗</span>
      </button>
    </div>

    <input ref="fileInput" type="file" class="hidden" @change="onFileSelected" />

    <IgcMapDialog
      :open="igcMapOpen"
      :flight-id="flightId"
      :filename="igcFilename"
      :label="igcLabel"
      @close="closeIgcMap"
    />

    <FlightImageViewerDialog
      :open="imageViewerOpen"
      :flight-id="flightId"
      :filename="imageFilename"
      :label="imageLabel"
      @close="closeImageViewer"
    />

    <ConfirmDialog
      :open="deleteCandidate !== null"
      title="Delete attachment"
      :message="`This will permanently delete ${deleteCandidate?.label || 'this attachment'} from Google Drive.`"
      confirm-label="Delete"
      :busy="deletingFilename !== null"
      @confirm="confirmDelete"
      @cancel="deleteCandidate = null"
    />
  </section>
</template>
