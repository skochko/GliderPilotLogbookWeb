<script setup lang="ts">
defineProps<{ message: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p>{{ message }}</p>
      <button
        type="button"
        class="rounded-md bg-red-100 px-3 py-1 text-sm font-medium hover:bg-red-200"
        @click="$emit('retry')"
      >
        Retry
      </button>
    </div>
  </div>
</template>
