<script setup lang="ts">
import { RouterLink } from 'vue-router'
import SiteFooter from '@/components/SiteFooter.vue'
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 text-slate-800">
    <div class="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:px-6">
      <header class="mb-8 flex items-center justify-between gap-4">
        <RouterLink to="/" class="text-lg font-semibold text-sky-800 hover:text-sky-900">
          GliderLogbook.co.uk
        </RouterLink>
        <RouterLink
          v-if="user"
          :to="user.has_logbook ? '/dashboard' : '/connect'"
          class="text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline"
        >
          Back to app
        </RouterLink>
        <RouterLink
          v-else
          to="/login"
          class="text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline"
        >
          Sign in
        </RouterLink>
      </header>

      <main class="flex-1">
        <slot />
      </main>

      <SiteFooter class="mt-10" />
    </div>
  </div>
</template>
