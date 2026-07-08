<script setup lang="ts">
import ActionButton from '@/components/ActionButton.vue'

defineProps<{
  message: string
  retryBusy?: boolean
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p>{{ message }}</p>
      <ActionButton variant="secondary" :busy="retryBusy" @click="$emit('retry')">
        Retry
      </ActionButton>
    </div>
  </div>
</template>
