<script setup lang="ts">
import ActionButton from '@/components/ActionButton.vue'
import { ref } from 'vue'
import { usePwaInstall } from '@/composables/usePwaInstall'

const { canInstall, isInstalled, isIosDevice, install } = usePwaInstall()
const installing = ref(false)

async function onInstall(): Promise<void> {
  if (installing.value) return
  installing.value = true
  try {
    await install()
  } finally {
    installing.value = false
  }
}
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
    <h2 class="text-lg font-semibold text-slate-900">Install app</h2>
    <p class="mt-1 text-sm text-slate-600">
      Add Glider Pilot Logbook to your home screen for quick access like a native app.
    </p>

    <div v-if="isInstalled" class="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
      App is installed. Open it from your home screen.
    </div>

    <div v-else-if="canInstall" class="mt-4">
      <ActionButton :busy="installing" @click="onInstall">Install app</ActionButton>
    </div>

    <div
      v-else-if="isIosDevice"
      class="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
    >
      <p class="font-medium text-slate-900">On iPhone or iPad</p>
      <ol class="mt-2 list-decimal space-y-1 pl-5">
        <li>Tap the Share button in Safari</li>
        <li>Choose <span class="font-medium">Add to Home Screen</span></li>
        <li>Tap <span class="font-medium">Add</span></li>
      </ol>
    </div>

    <p v-else class="mt-4 text-sm text-slate-600">
      Use your browser menu to install this app. In Chrome or Edge, look for
      <span class="font-medium">Install app</span> or an install icon in the address bar.
    </p>

    <p class="mt-4 text-xs text-slate-500">
      Requires an internet connection. Flight data stays in your Google Sheet; the app is a gateway to
      your logbook.
    </p>
  </section>
</template>
