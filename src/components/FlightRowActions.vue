<script setup lang="ts">
import {
  hasIgcAttachment,
  hasUserRemarks,
  mediaListIcon,
} from '@/lib/mediaTags'
import type { Flight } from '@/types'

defineProps<{
  flight: Flight
}>()

const emit = defineEmits<{
  openIgc: []
  openRemarks: []
  openMedia: []
}>()

const iconClass = 'h-6 w-6'
const buttonClass = 'inline-flex items-center justify-center rounded-md p-1.5 transition'
</script>

<template>
  <div class="flex items-center justify-start gap-0.5">
    <button
      v-if="hasIgcAttachment(flight)"
      type="button"
      :class="buttonClass + ' text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800'"
      title="View IGC track"
      aria-label="View IGC track"
      @click.stop="emit('openIgc')"
    >
      <svg :class="iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
    </button>

    <button
      v-if="hasUserRemarks(flight.remarks)"
      type="button"
      :class="buttonClass + ' text-amber-600 hover:bg-amber-50 lg:hidden'"
      title="View remarks"
      aria-label="View remarks"
      @click.stop="emit('openRemarks')"
    >
      <svg :class="iconClass" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h16a1 1 0 011 1v11a1 1 0 01-1 1H8l-4 3V5a1 1 0 011-1z" />
      </svg>
    </button>

    <button
      v-if="mediaListIcon(flight)"
      type="button"
      :class="buttonClass + ' text-sky-600 hover:bg-sky-50 hover:text-sky-800'"
      title="View media"
      aria-label="View media"
      @click.stop="emit('openMedia')"
    >
      <svg
        v-if="mediaListIcon(flight) === 'video'"
        :class="iconClass"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m15 10 4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
      <svg
        v-else-if="mediaListIcon(flight) === 'image'"
        :class="iconClass"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21Z"
        />
      </svg>
      <svg
        v-else
        :class="iconClass"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l7.693 7.694a4.5 4.5 0 01-6.364 6.364L4.5 9.75m7.875-3.75v11.25"
        />
      </svg>
    </button>
  </div>
</template>
