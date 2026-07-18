<script setup lang="ts">
import LandingNav from '@/components/landing/LandingNav.vue'
import SiteFooter from '@/components/SiteFooter.vue'
</script>

<template>
  <div class="landing-page min-h-screen">
    <LandingNav />

    <main class="mx-auto max-w-landing px-4 py-8 sm:px-6">
      <slot />
    </main>

    <footer class="mx-auto max-w-landing px-4 pb-10 sm:px-6">
      <SiteFooter />
    </footer>
  </div>
</template>
