<script setup lang="ts">
import SpinnerIcon from '@/components/SpinnerIcon.vue'

withDefaults(
  defineProps<{
    busy?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
    variant?: 'primary' | 'secondary' | 'danger'
  }>(),
  {
    busy: false,
    disabled: false,
    type: 'button',
    variant: 'primary',
  },
)

const variantClass = {
  primary: 'bg-sky-700 text-white hover:bg-sky-800',
  secondary: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}
</script>

<template>
  <button
    :type="type"
    class="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
    :class="variantClass[variant]"
    :disabled="disabled || busy"
  >
    <SpinnerIcon v-if="busy" size="sm" />
    <slot />
  </button>
</template>
