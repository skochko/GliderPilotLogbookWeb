<script setup lang="ts">
import { RouterLink } from 'vue-router'
import SiteFooter from '@/components/SiteFooter.vue'
import { useAuth } from '@/composables/useAuth'
import { useFlashMessage } from '@/composables/useFlashMessage'

const { login } = useAuth()
const { message, kind, clear } = useFlashMessage()
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 text-slate-800">
    <div
      v-if="message"
      class="border-b px-4 py-3 text-sm"
      :class="{
        'border-green-200 bg-green-50 text-green-800': kind === 'success',
        'border-red-200 bg-red-50 text-red-800': kind === 'error',
        'border-sky-200 bg-sky-50 text-sky-800': kind === 'info',
      }"
    >
      <div class="mx-auto flex max-w-md items-center justify-between gap-4">
        <span>{{ message }}</span>
        <button type="button" class="font-medium underline" @click="clear">Dismiss</button>
      </div>
    </div>

    <div class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <header class="mb-8 text-center">
        <RouterLink to="/" class="text-lg font-semibold text-sky-800 hover:text-sky-900">
          GliderLogbook.co.uk
        </RouterLink>
      </header>

      <section class="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <h1 class="text-3xl font-bold text-slate-900">Glider Pilot Logbook</h1>
        <p class="mt-3 text-slate-600">
          Sign in with Google to access your flight logbook stored in Google Sheets.
        </p>
        <button
          type="button"
          class="mt-8 rounded-md bg-sky-700 px-6 py-3 text-sm font-medium text-white hover:bg-sky-800"
          @click="login"
        >
          Sign in with Google
        </button>
        <p class="mt-6 text-xs text-slate-500">
          By signing in you agree to our
          <RouterLink to="/terms" class="text-sky-700 hover:underline">Terms of Service</RouterLink>
          and
          <RouterLink to="/privacy" class="text-sky-700 hover:underline">Privacy Policy</RouterLink>.
        </p>
      </section>

      <SiteFooter class="mt-10" />
    </div>
  </div>
</template>
