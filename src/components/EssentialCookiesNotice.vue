<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useCookieNotice } from '@/composables/useCookieNotice'

const { visible, dismiss } = useCookieNotice()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200/90 bg-white/95 px-4 py-3 text-xs text-slate-600 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:px-6"
        role="status"
        aria-live="polite"
      >
        <div class="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center sm:justify-between sm:text-left">
          <div class="space-y-1">
            <p>
              <span class="text-slate-700">We only use essential cookies</span>
              <span class="hidden sm:inline"> — required to keep you signed in. No analytics or marketing cookies.</span>
              <span class="sm:hidden"> — required to run the site.</span>
            </p>
            <p>
              <RouterLink to="/cookies" class="text-sky-700 hover:underline">Cookie Policy</RouterLink>
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 font-medium text-sky-700 hover:text-sky-800 hover:underline"
            @click="dismiss"
          >
            OK
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
