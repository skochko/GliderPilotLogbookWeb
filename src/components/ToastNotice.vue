<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { visible, message, kind, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="visible && message"
        class="pointer-events-none fixed inset-x-4 top-4 z-[100] flex justify-center sm:inset-x-auto sm:right-6 sm:top-6 sm:justify-end"
        role="status"
        aria-live="polite"
      >
        <div
          class="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg"
          :class="{
            'border-green-200 bg-green-50 text-green-900': kind === 'success',
            'border-red-200 bg-red-50 text-red-900': kind === 'error',
            'border-sky-200 bg-sky-50 text-sky-900': kind === 'info',
          }"
        >
          <div class="min-w-0 flex-1">
            <p class="font-medium">
              {{ kind === 'error' ? 'Signed out' : 'Notice' }}
            </p>
            <p class="mt-1">{{ message }}</p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded p-1 font-medium opacity-70 hover:opacity-100"
            aria-label="Dismiss notification"
            @click="dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
