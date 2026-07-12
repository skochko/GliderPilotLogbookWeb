<script setup lang="ts">
import { RouterLink } from 'vue-router'
import {
  hasIgcAttachment,
  hasUserRemarks,
  mediaListIcon,
} from '@/lib/mediaTags'
import { encodeFlightId } from '@/lib/flightId'
import type { Flight } from '@/types'

defineProps<{
  flight: Flight
}>()

const emit = defineEmits<{
  openView: []
  openIgc: []
  openRemarks: []
  openMedia: []
}>()

function slotClass(active: boolean): string {
  return active
    ? 'inline-flex rounded-md p-1 transition'
    : 'inline-flex w-6 justify-center p-1 opacity-0 pointer-events-none'
}
</script>

<template>
  <!-- Mobile: view + edit on top, media icons below -->
  <div class="flex flex-col items-center gap-0.5 sm:hidden">
    <div class="flex items-center gap-0">
      <button
        type="button"
        class="inline-flex rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-sky-700"
        title="View flight"
        aria-label="View flight"
        @click.stop="emit('openView')"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <RouterLink
        :to="`/flights/${encodeFlightId(flight.id)}`"
        class="inline-flex rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-sky-700"
        title="Edit flight"
        aria-label="Edit flight"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
          />
        </svg>
      </RouterLink>
    </div>

    <div class="flex h-6 items-center justify-center gap-0">
      <button
        type="button"
        :class="slotClass(hasIgcAttachment(flight)) + ' text-emerald-600 hover:bg-emerald-50'"
        :tabindex="hasIgcAttachment(flight) ? 0 : -1"
        aria-label="View IGC track"
        @click.stop="emit('openIgc')"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      </button>

      <button
        type="button"
        :class="slotClass(hasUserRemarks(flight.remarks)) + ' text-amber-600 hover:bg-amber-50'"
        :tabindex="hasUserRemarks(flight.remarks) ? 0 : -1"
        aria-label="View remarks"
        @click.stop="emit('openRemarks')"
      >
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4h16a1 1 0 011 1v11a1 1 0 01-1 1H8l-4 3V5a1 1 0 011-1z" />
        </svg>
      </button>

      <button
        type="button"
        :class="slotClass(mediaListIcon(flight) !== null) + ' text-sky-600 hover:bg-sky-50'"
        :tabindex="mediaListIcon(flight) !== null ? 0 : -1"
        aria-label="View media"
        @click.stop="emit('openMedia')"
      >
        <svg
          v-if="mediaListIcon(flight) === 'video'"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m15 10 4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <svg
          v-else-if="mediaListIcon(flight) === 'image'"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21Z"
          />
        </svg>
        <svg
          v-else
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l7.693 7.694a4.5 4.5 0 01-6.364 6.364L4.5 9.75m7.875-3.75v11.25"
          />
        </svg>
      </button>
    </div>
  </div>

  <!-- Desktop: single row -->
  <div class="hidden items-center justify-center gap-0 sm:flex">
    <button
      v-if="hasIgcAttachment(flight)"
      type="button"
      class="inline-flex rounded-md p-1 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-800"
      title="View IGC track"
      aria-label="View IGC track"
      @click.stop="emit('openIgc')"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
      class="inline-flex rounded-md p-1 text-amber-600 transition hover:bg-amber-50 lg:hidden"
      title="View remarks"
      aria-label="View remarks"
      @click.stop="emit('openRemarks')"
    >
      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h16a1 1 0 011 1v11a1 1 0 01-1 1H8l-4 3V5a1 1 0 011-1z" />
      </svg>
    </button>

    <button
      v-if="mediaListIcon(flight)"
      type="button"
      class="inline-flex rounded-md p-1 text-sky-600 transition hover:bg-sky-50 hover:text-sky-800"
      title="View media"
      aria-label="View media"
      @click.stop="emit('openMedia')"
    >
      <svg
        v-if="mediaListIcon(flight) === 'video'"
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m15 10 4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
      <svg
        v-else-if="mediaListIcon(flight) === 'image'"
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21Z"
        />
      </svg>
      <svg
        v-else
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l7.693 7.694a4.5 4.5 0 01-6.364 6.364L4.5 9.75m7.875-3.75v11.25"
        />
      </svg>
    </button>

    <button
      type="button"
      class="inline-flex rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-sky-700"
      title="View flight"
      aria-label="View flight"
      @click.stop="emit('openView')"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
        />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <RouterLink
      :to="`/flights/${encodeFlightId(flight.id)}`"
      class="inline-flex rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-sky-700"
      title="Edit"
      aria-label="Edit flight"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        />
      </svg>
    </RouterLink>
  </div>
</template>
