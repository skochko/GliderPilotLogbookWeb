<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import SpinnerIcon from '@/components/SpinnerIcon.vue'
import { fetchFlightMediaBlob } from '@/api/flightMedia'
import { isApiError } from '@/api/errors'

const props = defineProps<{
  open: boolean
  flightId: string | null
  filename: string | null
  label: string | null
}>()

const emit = defineEmits<{ close: [] }>()

const loading = ref(false)
const error = ref<string | null>(null)
const imageUrl = ref<string | null>(null)

function revokeImageUrl(): void {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = null
  }
}

async function loadImage(): Promise<void> {
  if (!props.flightId || !props.filename) {
    return
  }

  loading.value = true
  error.value = null
  revokeImageUrl()

  try {
    const blob = await fetchFlightMediaBlob(props.flightId, props.filename)
    imageUrl.value = URL.createObjectURL(blob)
  } catch (err) {
    error.value = isApiError(err) ? err.message : 'Failed to load image'
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.open, props.flightId, props.filename] as const,
  ([open, flightId, filename]) => {
    if (open && flightId && filename) {
      void loadImage()
      return
    }

    revokeImageUrl()
    error.value = null
    loading.value = false
  },
)

onBeforeUnmount(() => {
  revokeImageUrl()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex flex-col bg-black/90 p-0 sm:items-center sm:justify-center sm:p-4"
      @click.self="emit('close')"
    >
      <div
        class="flex h-full w-full flex-col sm:h-[min(92vh,920px)] sm:max-w-5xl sm:rounded-lg sm:border sm:border-slate-700 sm:bg-slate-950 sm:shadow-xl"
        @click.stop
      >
        <div class="flex shrink-0 items-center justify-between px-4 py-3 sm:px-5">
          <div class="min-w-0">
            <h2 class="text-base font-semibold text-white sm:text-lg">Image</h2>
            <p v-if="label" class="truncate text-xs text-slate-400 sm:text-sm" :title="filename ?? undefined">
              {{ label }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Close"
            @click="emit('close')"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="relative min-h-0 flex-1 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-5">
          <ErrorBanner v-if="error" :message="error" :retry-busy="loading" @retry="loadImage" />

          <div
            v-if="loading"
            class="absolute inset-0 flex items-center justify-center gap-2 text-sm text-slate-300"
          >
            <SpinnerIcon class="h-4 w-4" />
            Loading image…
          </div>

          <img
            v-else-if="imageUrl"
            :src="imageUrl"
            :alt="label || filename || 'Flight image'"
            class="mx-auto h-full max-h-full w-full object-contain"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>
