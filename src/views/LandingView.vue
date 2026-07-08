<script setup lang="ts">
import { RouterLink } from 'vue-router'
import SiteFooter from '@/components/SiteFooter.vue'

const features = [
  'Mobile-friendly access to your flight records',
  'Simple and convenient logbook management',
  'Support for existing gliding logbook formats',
  'Tools for pilots and gliding clubs',
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 text-slate-800">
    <div class="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-12 sm:px-6">
      <header class="text-center">
        <h1 class="text-3xl font-bold text-sky-800 sm:text-4xl">GliderLogbook.co.uk</h1>
        <p class="mt-3 text-lg text-slate-600 sm:text-xl">Your gliding logbook. Anywhere. Anytime.</p>
      </header>

      <section class="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 class="text-xl font-semibold text-slate-900">Coming Soon</h2>

        <p class="mt-4 text-slate-600 leading-relaxed">
          We are currently working on creating a modern, mobile-friendly platform for glider pilots
          and clubs.
        </p>

        <p class="mt-4 text-slate-600 leading-relaxed">
          The aim is to make managing, viewing and updating your flight records easier and more
          convenient.
        </p>

        <h2 class="mt-8 text-xl font-semibold text-slate-900">What we are working on</h2>

        <ul class="mt-4 space-y-3 text-slate-700">
          <li v-for="feature in features" :key="feature" class="flex gap-3">
            <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-600" aria-hidden="true" />
            <span>{{ feature }}</span>
          </li>
        </ul>

        <div
          class="mt-8 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-center text-base font-semibold text-sky-800"
        >
          Website under development
        </div>

        <p class="mt-6 text-slate-600 leading-relaxed">
          We are building the platform step by step and will share more information soon.
        </p>

        <div class="mt-8 flex justify-center">
          <RouterLink
            to="/login"
            class="inline-flex items-center justify-center rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
          >
            Sign in
          </RouterLink>
        </div>
      </section>

      <SiteFooter class="mt-10">
        <p class="mb-4">Good lift and happy soaring!</p>
      </SiteFooter>
    </div>
  </div>
</template>
