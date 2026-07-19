<script setup lang="ts">
import { useSlots } from 'vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    titleId?: string
    backDisabled?: boolean
    showBack?: boolean
    showDesktopClose?: boolean
  }>(),
  {
    titleId: 'form-sheet-title',
    backDisabled: false,
    showBack: true,
    showDesktopClose: false,
  },
)

const emit = defineEmits<{ back: [] }>()
const slots = useSlots()
</script>

<template>
  <div class="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">
    <header
      class="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 pb-3 sm:px-5"
      style="padding-top: max(0.75rem, env(safe-area-inset-top))"
    >
      <button
        v-if="showBack"
        type="button"
        class="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100"
        :class="showDesktopClose ? 'sm:hidden' : ''"
        aria-label="Go back"
        :disabled="backDisabled"
        @click="emit('back')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" aria-hidden="true">
          <path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
        </svg>
      </button>

      <div class="min-w-0 flex-1">
        <h2 :id="titleId" class="text-lg font-semibold text-slate-900">
          {{ title }}
        </h2>
        <p v-if="subtitle" class="text-sm text-slate-500">
          {{ subtitle }}
        </p>
      </div>

      <button
        v-if="showDesktopClose"
        type="button"
        class="hidden rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 sm:inline-flex"
        aria-label="Close"
        :disabled="backDisabled"
        @click="emit('back')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" aria-hidden="true">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-6 sm:px-5">
      <slot />
    </div>

    <footer
      v-if="slots.footer"
      class="mt-auto shrink-0 border-t border-slate-200 bg-white px-4 pt-4 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] sm:px-5"
      style="padding-bottom: max(1rem, env(safe-area-inset-bottom))"
    >
      <div class="flex w-full flex-col gap-3">
        <slot name="footer" />
      </div>
    </footer>
  </div>
</template>
