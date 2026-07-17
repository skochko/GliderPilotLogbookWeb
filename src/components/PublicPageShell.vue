<script setup lang="ts">
import { RouterLink } from 'vue-router'
import GliderLogo from '@/components/GliderLogo.vue'
import ClubSiteNav from '@/components/ClubSiteNav.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 text-slate-800">
    <div class="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:px-6">
      <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <RouterLink to="/" class="flex items-center gap-2 text-lg font-semibold text-sky-800 hover:text-sky-900">
          <GliderLogo size-class="h-8 w-8 shrink-0" label="Glider Pilot Logbook" />
          <span>Glider Pilot Logbook</span>
        </RouterLink>
        <div class="flex flex-col items-start gap-3 sm:items-end">
          <ClubSiteNav variant="header" />
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
        </div>
      </header>

      <main class="flex-1">
        <slot />
      </main>

      <SiteFooter class="mt-10" />
    </div>
  </div>
</template>
