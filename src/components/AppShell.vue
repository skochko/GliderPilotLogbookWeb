<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useFlashMessage } from '@/composables/useFlashMessage'

const { user, logout } = useAuth()
const { message, kind, clear } = useFlashMessage()
const route = useRoute()
const menuOpen = ref(false)

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/flights', label: 'Flights' },
  { to: '/settings', label: 'Settings' },
  { to: '/summary', label: 'Summary' },
  { to: '/profile', label: 'Profile' },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function toggleMenu(): void {
  menuOpen.value = !menuOpen.value
}

function closeMenu(): void {
  menuOpen.value = false
}

watch(
  () => route.path,
  () => {
    menuOpen.value = false
  },
)
</script>

<template>
  <div class="min-h-screen">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div class="flex min-w-0 items-center gap-3 sm:gap-6">
          <button
            v-if="user?.has_logbook"
            type="button"
            class="rounded-md p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
            aria-label="Open menu"
            :aria-expanded="menuOpen"
            @click="toggleMenu"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path
                v-if="!menuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <RouterLink to="/" class="truncate text-lg font-semibold text-sky-800">
            Glider Pilot Logbook
          </RouterLink>
          <nav v-if="user?.has_logbook" class="hidden items-center gap-1 sm:flex">
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="rounded-md px-3 py-2 text-sm font-medium transition"
              :class="
                isActive(item.to)
                  ? 'bg-sky-100 text-sky-900'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              "
            >
              {{ item.label }}
            </RouterLink>
          </nav>
        </div>
        <div v-if="user" class="flex shrink-0 items-center gap-2 text-sm sm:gap-3">
          <span class="hidden text-slate-600 md:inline">{{ user.name }}</span>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-2 py-1.5 text-slate-700 hover:bg-slate-50 sm:px-3"
            @click="logout"
          >
            Log out
          </button>
        </div>
      </div>

      <nav
        v-if="user?.has_logbook && menuOpen"
        class="border-t border-slate-200 bg-white px-4 py-2 sm:hidden"
      >
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="block rounded-md px-3 py-3 text-sm font-medium transition"
          :class="
            isActive(item.to)
              ? 'bg-sky-100 text-sky-900'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          "
          @click="closeMenu"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </header>

    <div
      v-if="message"
      class="border-b px-4 py-3 text-sm"
      :class="{
        'border-green-200 bg-green-50 text-green-800': kind === 'success',
        'border-red-200 bg-red-50 text-red-800': kind === 'error',
        'border-sky-200 bg-sky-50 text-sky-800': kind === 'info',
      }"
    >
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <span>{{ message }}</span>
        <button type="button" class="font-medium underline" @click="clear">Dismiss</button>
      </div>
    </div>

    <main class="mx-auto max-w-6xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>
