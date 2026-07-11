<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { SITE_PAGES } from '@/lib/sitePages'
</script>

<template>
  <footer class="text-center text-sm text-landing-muted">
    <div v-if="$slots.default" class="mb-4">
      <slot />
    </div>
    <nav class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      <RouterLink
        v-for="item in SITE_PAGES"
        :key="item.type"
        :to="item.path"
        class="transition hover:text-landing-primary hover:underline"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
    <p class="mt-4">© GliderLogbook.co.uk</p>
  </footer>
</template>
