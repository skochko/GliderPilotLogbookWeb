<script setup lang="ts">
import SpinnerIcon from '@/components/SpinnerIcon.vue'

defineProps<{ label?: string }>()
</script>

<template>
  <div class="flex items-center justify-center py-16 text-slate-500">
    <div class="flex items-center gap-3">
      <SpinnerIcon />
      <span>{{ label ?? 'Loading…' }}</span>
    </div>
  </div>
</template>
