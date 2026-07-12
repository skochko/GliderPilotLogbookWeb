<script setup lang="ts">
import type { FlightMediaItem } from '@/types'

defineProps<{
  open: boolean
  items: readonly FlightMediaItem[]
}>()

const emit = defineEmits<{
  close: []
  select: [FlightMediaItem]
}>()
</script>

<template>
  <dialog
    v-if="open"
    open
    class="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/40 p-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-sm rounded-lg border border-slate-200 bg-white shadow-xl">
      <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 class="text-lg font-semibold text-slate-900">Choose IGC track</h2>
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

      <ul class="space-y-2 px-5 py-4">
        <li v-for="item in items" :key="item.filename">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
            @click="emit('select', item)"
          >
            <span class="truncate font-medium text-slate-900" :title="item.filename">{{ item.label }}</span>
            <span class="shrink-0 text-sky-700">View map</span>
          </button>
        </li>
      </ul>
    </div>
  </dialog>
</template>
