<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { login } = useAuth()
</script>

<template>
  <div class="mx-auto max-w-md py-16 text-center">
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
  </div>
</template>
