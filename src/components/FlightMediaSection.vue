<script setup lang="ts">
import { computed, ref } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import IgcMapDialog from '@/components/IgcMapDialog.vue'
import FlightImageViewerDialog from '@/components/FlightImageViewerDialog.vue'
import UploadProgressBar from '@/components/UploadProgressBar.vue'
import {
  attachFlightMediaFromDrive,
  getFlightMediaFolder,
  uploadFlightMedia,
  type MediaUploadProgress,
} from '@/api/flightMedia'
import { isApiError } from '@/api/errors'
import { useGooglePicker } from '@/composables/useGooglePicker'
import { FLIGHT_MEDIA_MAX_FILES, FLIGHT_MEDIA_MAX_UPLOAD_BYTES } from '@/types/flightMedia'
import type { Flight, FlightMediaItem } from '@/types'

const props = defineProps<{
  flightId: string
  media?: readonly FlightMediaItem[]
}>()

const emit = defineEmits<{
  updated: [Flight]
}>()

const { pickDriveFile } = useGooglePicker()

const uploading = ref(false)
const attaching = ref(false)
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

const mediaCount = computed(() => props.media?.length ?? 0)
const canAddMore = computed(() => mediaCount.value < FLIGHT_MEDIA_MAX_FILES)
const maxUploadLabel = `${FLIGHT_MEDIA_MAX_UPLOAD_BYTES / (1024 * 1024)} MB`

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
    const folder = await getFlightMediaFolder(props.flightId)
    const picked = await pickDriveFile(folder.folder_id || undefined)
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
</script>

<template>
  <section class="space-y-3 border-t border-slate-200 pt-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-medium text-slate-900">Media attachments</h3>
        <p class="mt-0.5 text-xs text-slate-500">
          Up to {{ FLIGHT_MEDIA_MAX_FILES }} files per flight. In-app upload limit {{ maxUploadLabel }}.
        </p>
      </div>
      <span class="text-xs tabular-nums text-slate-500">{{ mediaCount }}/{{ FLIGHT_MEDIA_MAX_FILES }}</span>
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
        class="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
      >
        <div class="min-w-0">
          <span class="font-medium text-slate-900">{{ item.label }}</span>
          <span class="text-slate-400"> · </span>
          <span class="uppercase text-xs tracking-wide text-slate-500">{{ item.type }}</span>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <button
            v-if="item.type === 'igc'"
            type="button"
            class="shrink-0 text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline"
            @click="openIgcMap(item)"
          >
            View on map
          </button>
          <button
            v-if="item.type === 'image'"
            type="button"
            class="shrink-0 text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline"
            @click="openImageViewer(item)"
          >
            View image
          </button>
        </div>
      </li>
    </ul>

    <div class="flex flex-wrap gap-2">
      <ActionButton
        variant="secondary"
        :busy="uploading"
        :disabled="!canAddMore || attaching"
        @click="openFilePicker"
      >
        Upload file
      </ActionButton>
      <ActionButton
        variant="secondary"
        :disabled="uploading || attaching"
        @click="openDriveFolder"
      >
        Open Drive folder
      </ActionButton>
      <ActionButton
        variant="secondary"
        :busy="attaching"
        :disabled="!canAddMore || uploading"
        @click="attachFromDrive"
      >
        Attach from Drive
      </ActionButton>
    </div>

    <input
      ref="fileInput"
      type="file"
      class="hidden"
      @change="onFileSelected"
    />

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
  </section>
</template>
