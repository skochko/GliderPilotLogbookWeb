<script setup lang="ts">
import { computed } from 'vue'
import { formatDurationDisplay, splitDurationDisplay } from '@/lib/duration'

const props = defineProps<{
  value: string | null | undefined
}>()

const parts = computed(() => splitDurationDisplay(props.value))
</script>

<template>
  <div v-if="parts.secondary" class="leading-tight">
    <div>{{ parts.primary }}</div>
    <div class="text-xs text-slate-600">{{ parts.secondary }}</div>
  </div>
  <span v-else>{{ formatDurationDisplay(value) }}</span>
</template>
