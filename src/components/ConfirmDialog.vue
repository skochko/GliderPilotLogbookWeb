<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
}>()

defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    @click.self="$emit('cancel')"
  >
    <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
      <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
      <p class="mt-2 text-sm text-slate-600">{{ message }}</p>
      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          @click="$emit('confirm')"
        >
          {{ confirmLabel ?? 'Confirm' }}
        </button>
      </div>
    </div>
  </div>
</template>
