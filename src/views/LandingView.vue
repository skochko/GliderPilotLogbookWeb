<script setup lang="ts">
import { RouterLink } from 'vue-router'
import SiteFooter from '@/components/SiteFooter.vue'

const features = [
  'Automatic flight import from participating gliding clubs',
  'Integration with club flight accounting and GliderPilotLogbookSync',
  'Your Google Spreadsheet stays the source of truth',
  'Mobile-friendly logbook access, statistics, and dashboard',
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 text-slate-800">
    <div class="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-12 sm:px-6">
      <header class="text-center">
        <h1 class="text-3xl font-bold text-sky-800 sm:text-4xl">GliderLogbook.co.uk</h1>
        <p class="mt-3 text-lg text-slate-600 sm:text-xl">
          Automate your gliding logbook. Connect to club flight systems.
        </p>
      </header>

      <section class="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 class="text-xl font-semibold text-slate-900">Logbook automation for glider pilots</h2>

        <p class="mt-4 text-slate-600 leading-relaxed">
          GliderLogbook.co.uk links your personal Google Sheets logbook to the flight records your
          club already keeps. Less retyping, fewer missed flights, and a clear view of your flying
          from any device.
        </p>

        <p class="mt-4 text-slate-600 leading-relaxed">
          You stay in control: your spreadsheet remains yours, manual entries always work, and club
          import is optional and consent-based.
        </p>

        <h2 class="mt-8 text-xl font-semibold text-slate-900">Key features</h2>

        <ul class="mt-4 space-y-3 text-slate-700">
          <li v-for="feature in features" :key="feature" class="flex gap-3">
            <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-600" aria-hidden="true" />
            <span>{{ feature }}</span>
          </li>
        </ul>

        <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <RouterLink
            to="/login"
            class="inline-flex items-center justify-center rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
          >
            Sign in
          </RouterLink>
          <RouterLink
            to="/about"
            class="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Learn more
          </RouterLink>
        </div>
      </section>

      <SiteFooter class="mt-10">
        <p class="mb-4">Good lift and happy soaring!</p>
      </SiteFooter>
    </div>
  </div>
</template>
