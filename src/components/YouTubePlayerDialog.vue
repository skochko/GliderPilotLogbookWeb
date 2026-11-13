<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import YouTubePlayer from '@/components/YouTubePlayer.vue'
import type { FlightMediaItem } from '@/types'

const props = defineProps<{ open: boolean; video: FlightMediaItem | null }>()
const emit = defineEmits<{ close: [] }>()
const closeButton = ref<HTMLButtonElement | null>(null)
let returnFocus: HTMLElement | null = null

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      returnFocus = document.activeElement as HTMLElement | null
      window.addEventListener('keydown', onKeydown)
      await nextTick()
      closeButton.value?.focus()
    } else {
      window.removeEventListener('keydown', onKeydown)
      returnFocus?.focus()
      returnFocus = null
    }
  },
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && video"
      class="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      @click.self="emit('close')"
    >
      <div
        class="w-full rounded-t-xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-3xl sm:rounded-xl sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="youtube-dialog-title"
      >
        <div class="mb-3 flex items-center justify-between gap-3">
          <h2 id="youtube-dialog-title" class="text-lg font-semibold text-slate-900">
            Flight video
          </h2>
          <button
            ref="closeButton"
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="Close"
            @click="emit('close')"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <YouTubePlayer :video="video" />
      </div>
    </div>
  </Teleport>
</template>
