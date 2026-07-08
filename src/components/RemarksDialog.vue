<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import { encodeFlightId } from '@/lib/flightId'

defineProps<{
  open: boolean
  text: string
  flightId: string | null
}>()

defineEmits<{ close: [] }>()
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    @click.self="$emit('close')"
  >
    <div class="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl">
      <div class="border-b border-slate-200 px-5 py-4">
        <h2 class="text-lg font-semibold text-slate-900">Remarks and endorsements</h2>
      </div>
      <div class="overflow-y-auto px-5 py-4">
        <p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{{ text }}</p>
      </div>
      <div class="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
        <ActionButton variant="secondary" @click="$emit('close')">Close</ActionButton>
        <RouterLink
          v-if="flightId"
          :to="`/flights/${encodeFlightId(flightId)}`"
          class="inline-flex items-center rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
          @click="$emit('close')"
        >
          Edit flight
        </RouterLink>
      </div>
    </div>
  </div>
</template>
