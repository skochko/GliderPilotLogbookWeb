<script setup lang="ts">
import { ref, watch } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import GliderLogo from '@/components/GliderLogo.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useDisplaySettings } from '@/composables/useDisplaySettings'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useLogbookDisconnect } from '@/composables/useLogbookDisconnect'
import { resetLogbookState } from '@/composables/resetLogbookState'

const { user, mutating, logout } = useAuth()
const { ensureLoaded: ensureDisplaySettingsLoaded } = useDisplaySettings()
const { disconnectLogbook, disconnecting } = useLogbookDisconnect()
const { message, kind, clear } = useFlashMessage()
const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)
const disconnectOpen = ref(false)

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/flights', label: 'Flights' },
  { to: '/statistics', label: 'Statistics' },
  { to: '/settings', label: 'Settings' },
  { to: '/automation', label: 'Automation' },
  { to: '/profile', label: 'Profile' },
]

function isActive(path: string): boolean {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(path)
}

function toggleMenu(): void {
  menuOpen.value = !menuOpen.value
}

function closeMenu(): void {
  menuOpen.value = false
}

watch(
  () => user.value?.has_logbook,
  (hasLogbook) => {
    if (hasLogbook) {
      void ensureDisplaySettingsLoaded()
    }
  },
  { immediate: true },
)

function openDisconnectDialog(): void {
  closeMenu()
  disconnectOpen.value = true
}

async function confirmDisconnect(): Promise<void> {
  const ok = await disconnectLogbook()
  if (ok) {
    disconnectOpen.value = false
  }
}

async function onLogout(): Promise<void> {
  await logout()
  if (!user.value) {
    resetLogbookState()
    await router.replace({ name: 'landing' })
  }
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
          <RouterLink to="/dashboard" class="flex min-w-0 items-center gap-2 truncate text-lg font-semibold text-sky-800">
            <GliderLogo size-class="h-7 w-7 shrink-0" />
            <span class="truncate">Glider Pilot Logbook</span>
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
          <button
            v-if="user.has_logbook"
            type="button"
            class="hidden rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:inline-block sm:px-3"
            :disabled="disconnecting || mutating"
            @click="openDisconnectDialog"
          >
            Disconnect logbook
          </button>
          <span class="hidden text-slate-600 md:inline">{{ user.name }}</span>
          <ActionButton variant="secondary" class="!px-2 !py-1.5 sm:!px-3" :busy="mutating" @click="onLogout">
            Log out
          </ActionButton>
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
        <button
          type="button"
          class="mt-1 block w-full rounded-md px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          :disabled="disconnecting || mutating"
          @click="openDisconnectDialog"
        >
          Disconnect logbook
        </button>
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

    <div class="border-t border-slate-200 bg-white px-4 py-6">
      <SiteFooter />
    </div>

    <ConfirmDialog
      :open="disconnectOpen"
      title="Disconnect logbook"
      message="You will no longer see flights from this spreadsheet in the app. Your data in Google Sheets is not deleted."
      confirm-label="Disconnect"
      :busy="disconnecting"
      @confirm="confirmDisconnect"
      @cancel="disconnectOpen = false"
    />
  </div>
</template>
