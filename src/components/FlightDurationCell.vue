<script setup lang="ts">
import { formatDurationDisplay } from '@/lib/duration'

defineProps<{
  value: string | null | undefined
}>()
</script>

<template>
  <span class="whitespace-nowrap">{{ formatDurationDisplay(value) }}</span>
</template>
