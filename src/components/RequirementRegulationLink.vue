<script setup lang="ts">
defineProps<{
  url?: string
  requirementLabel: string
}>()
</script>

<template>
  <a
    v-if="url"
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex shrink-0 items-center rounded-sm p-0.5 text-sky-700 transition hover:bg-sky-50 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
    :aria-label="`View official rules for ${requirementLabel} (opens in a new tab)`"
    :title="`View official rules for ${requirementLabel}`"
  >
    <svg
      class="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M14 5h5v5" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M10 14 19 5" />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"
      />
    </svg>
  </a>
</template>
