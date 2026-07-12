<script setup lang="ts">
withDefaults(
  defineProps<{
    sizeClass?: string
    label?: string
  }>(),
  {
    sizeClass: 'h-8 w-8',
    label: 'Glider Pilot Logbook',
  },
)
</script>

<template>
  <img src="@/assets/logo.svg" :class="sizeClass" :alt="label" decoding="async" />
</template>
