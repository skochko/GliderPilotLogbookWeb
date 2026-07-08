<script setup lang="ts">
defineProps<{ label?: string }>()
</script>

<template>
  <div class="flex items-center justify-center py-16 text-slate-500">
    <div class="flex items-center gap-3">
      <span
        class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600"
      />
      <span>{{ label ?? 'Loading…' }}</span>
    </div>
  </div>
</template>
