<script setup lang="ts">
import ActionButton from '@/components/ActionButton.vue'

defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  busy?: boolean
}>()

defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    @click.self="!busy && $emit('cancel')"
  >
    <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
      <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
      <p class="mt-2 text-sm text-slate-600">{{ message }}</p>
      <div class="mt-6 flex justify-end gap-3">
        <ActionButton variant="secondary" :disabled="busy" @click="$emit('cancel')">
          Cancel
        </ActionButton>
        <ActionButton variant="danger" :busy="busy" @click="$emit('confirm')">
          {{ confirmLabel ?? 'Confirm' }}
        </ActionButton>
      </div>
    </div>
  </div>
</template>
