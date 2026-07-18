<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import GliderLogo from '@/components/GliderLogo.vue'
import ClubSiteNav from '@/components/ClubSiteNav.vue'
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()
const route = useRoute()
const navOpen = ref(false)
const elevated = ref(false)

const onLanding = computed(() => route.name === 'landing')

const landingSectionLinks = [
  { id: 'features', label: 'Features' },
  { id: 'google-sheets', label: 'Your data' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'faq', label: 'FAQ' },
] as const

const siteLinks = [
  { path: '/about', label: 'About' },
  { path: '/faq', label: 'FAQ' },
  { path: '/contact', label: 'Contact' },
] as const

const navLinks = computed(() => {
  if (onLanding.value) {
    return landingSectionLinks.map((link) => ({
      key: link.id,
      label: link.label,
      href: `#${link.id}`,
    }))
  }
  return siteLinks.map((link) => ({
    key: link.path,
    label: link.label,
    href: link.path,
  }))
})

function onScroll(): void {
  elevated.value = window.scrollY > 8
}

function closeNav(): void {
  navOpen.value = false
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b transition-colors duration-200"
    :class="
      elevated
        ? 'border-landing-border bg-white/90 shadow-sm backdrop-blur-md'
        : 'border-transparent bg-landing-bg/80 backdrop-blur-sm'
    "
  >
    <div class="mx-auto flex max-w-landing items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <RouterLink to="/" class="flex items-center gap-2 text-base font-semibold text-landing-text sm:text-lg">
        <GliderLogo size-class="h-8 w-8 shrink-0" label="Glider Pilot Logbook" />
        <span>Glider Pilot Logbook</span>
      </RouterLink>

      <nav class="hidden items-center gap-6 md:flex" aria-label="Primary">
        <template v-for="link in navLinks" :key="link.key">
          <RouterLink
            v-if="link.href.startsWith('/')"
            :to="link.href"
            class="text-sm font-medium text-landing-secondary transition hover:text-landing-primary"
          >
            {{ link.label }}
          </RouterLink>
          <a
            v-else
            :href="link.href"
            class="text-sm font-medium text-landing-secondary transition hover:text-landing-primary"
          >
            {{ link.label }}
          </a>
        </template>
        <ClubSiteNav variant="landing" />
      </nav>

      <div class="flex items-center gap-2 sm:gap-3">
        <RouterLink
          v-if="user"
          :to="user.has_logbook ? '/dashboard' : '/connect'"
          class="hidden text-sm font-medium text-landing-primary hover:underline sm:inline"
        >
          Open app
        </RouterLink>
        <RouterLink
          v-else
          to="/login"
          class="inline-flex items-center justify-center rounded-lg bg-landing-primary px-3.5 py-2 text-sm font-medium text-white transition hover:bg-landing-primary-hover"
        >
          Get started
        </RouterLink>
        <button
          type="button"
          class="inline-flex rounded-lg border border-landing-border p-2 text-landing-secondary md:hidden"
          :aria-expanded="navOpen"
          aria-controls="landing-mobile-nav"
          @click="navOpen = !navOpen"
        >
          <span class="sr-only">Menu</span>
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              v-if="!navOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <nav
      v-if="navOpen"
      id="landing-mobile-nav"
      class="border-t border-landing-border bg-white px-4 py-4 md:hidden"
      aria-label="Mobile"
    >
      <ul class="space-y-3">
        <li v-for="link in navLinks" :key="link.key">
          <RouterLink
            v-if="link.href.startsWith('/')"
            :to="link.href"
            class="block text-sm font-medium text-landing-secondary"
            @click="closeNav"
          >
            {{ link.label }}
          </RouterLink>
          <a
            v-else
            :href="link.href"
            class="block text-sm font-medium text-landing-secondary"
            @click="closeNav"
          >
            {{ link.label }}
          </a>
        </li>
        <li class="border-t border-landing-border pt-3">
          <ClubSiteNav variant="landing" />
        </li>
        <li>
          <RouterLink
            v-if="user"
            :to="user.has_logbook ? '/dashboard' : '/connect'"
            class="block text-sm font-medium text-landing-primary"
            @click="closeNav"
          >
            Open app
          </RouterLink>
          <RouterLink
            v-else
            to="/login"
            class="block text-sm font-medium text-landing-primary"
            @click="closeNav"
          >
            Get started
          </RouterLink>
        </li>
      </ul>
    </nav>
  </header>
</template>
