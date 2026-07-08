<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)

const sizeClass = {
  sm: 'h-4 w-4 border',
  md: 'h-5 w-5 border-2',
}
</script>

<template>
  <span
    class="inline-block animate-spin rounded-full border-slate-300 border-t-sky-600"
    :class="sizeClass[size]"
    role="status"
    aria-label="Loading"
  />
</template>
