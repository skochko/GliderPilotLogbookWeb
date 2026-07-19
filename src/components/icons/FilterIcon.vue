<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)

const sizeClass = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
}
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
    :class="sizeClass[size]"
  >
    <path
      fill-rule="evenodd"
      d="M2 3.5A.5.5 0 0 1 2.5 3h15a.5.5 0 0 1 .4.8l-5.54 7.4A.5.5 0 0 1 12 12v4.5a.5.5 0 0 1-.724.447l-2-1A.5.5 0 0 1 9 15.5V12a.5.5 0 0 1-.1-.3L2.1 3.8A.5.5 0 0 1 2 3.5Zm3.24 1h9.52L10 10.96V15.18l.76-.38V11a.5.5 0 0 1 .1-.3l3.24-4.32H5.24Z"
      clip-rule="evenodd"
    />
  </svg>
</template>
