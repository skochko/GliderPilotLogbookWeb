<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import GliderLogo from '@/components/GliderLogo.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useDisplaySettings } from '@/composables/useDisplaySettings'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { resetLogbookState } from '@/composables/resetLogbookState'
import { useLogbookSync } from '@/composables/useLogbookSync'
import { isApiError } from '@/api/errors'

const { user, mutating, logout } = useAuth()
const { ensureLoaded: ensureDisplaySettingsLoaded } = useDisplaySettings()
const { message, kind, clear, show } = useFlashMessage()
const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)
const userMenuOpen = ref(false)
const syncPanelOpen = ref(false)
const clock = ref(Date.now())
let clockTimer: ReturnType<typeof setInterval> | null = null
const {
  status: syncStatus,
  isSyncing,
  syncCompleteCount,
  manualRefreshAvailableAt,
  refreshSyncStatus,
  requestSync,
} = useLogbookSync()

const DESKTOP_MEDIA_QUERY = '(min-width: 640px)'
const isDesktop = ref(
  typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MEDIA_QUERY).matches : false,
)
let desktopMediaQuery: MediaQueryList | null = null

function syncDesktop(): void {
  isDesktop.value = desktopMediaQuery?.matches ?? false
}

function closeSyncPanel(): void {
  syncPanelOpen.value = false
}

function onEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape') closeSyncPanel()
}

const hideMobileChrome = computed(
  () => Boolean(route.meta.mobileFullscreenSheet) && !isDesktop.value,
)

onMounted(() => {
  desktopMediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
  syncDesktop()
  desktopMediaQuery.addEventListener('change', syncDesktop)
  window.addEventListener('keydown', onEscape)
  clockTimer = setInterval(() => {
    clock.value = Date.now()
  }, 1_000)
  if (user.value?.has_logbook && !user.value.is_demo) {
    void refreshSyncStatus().catch(() => undefined)
  }
})

onUnmounted(() => {
  desktopMediaQuery?.removeEventListener('change', syncDesktop)
  window.removeEventListener('keydown', onEscape)
  if (clockTimer !== null) clearInterval(clockTimer)
})

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/flights', label: 'Flights' },
  { to: '/statistics', label: 'Statistics' },
  {
    to: '/qualification-events',
    label: 'Training & Qualification Events',
    desktopLabel: 'Training',
  },
  { to: '/settings', label: 'Settings', desktopAccountOnly: true },
  { to: '/automation', label: 'Automation' },
  { to: '/profile', label: 'Profile', desktopAccountOnly: true },
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

const refreshCoolingDown = computed(
  () => manualRefreshAvailableAt.value !== null && clock.value < manualRefreshAvailableAt.value,
)

function relativeTime(value: string | null | undefined): string | null {
  if (!value) return null
  const seconds = Math.max(0, Math.floor((clock.value - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const syncPillLabel = computed(() => {
  if (isSyncing.value) return 'Syncing…'
  if (syncStatus.value?.status === 'error') return 'Sync failed'
  if (syncStatus.value?.last_source_checked_at || syncStatus.value?.last_synced_at) {
    return 'Up to date'
  }
  return 'Not checked'
})

const syncPillIcon = computed(() => {
  if (isSyncing.value) return '↻'
  if (syncStatus.value?.status === 'error') return '⚠'
  if (syncStatus.value?.last_source_checked_at || syncStatus.value?.last_synced_at) return '✓'
  return '—'
})

const lastCheckedLabel = computed(
  () =>
    relativeTime(syncStatus.value?.last_source_checked_at ?? syncStatus.value?.last_synced_at) ??
    'Never',
)

const lastUpdatedLabel = computed(() => relativeTime(syncStatus.value?.last_synced_at) ?? 'Never')

const refreshActionLabel = computed(() => {
  if (isSyncing.value) return 'Syncing…'
  if (refreshCoolingDown.value) {
    const seconds = Math.max(
      1,
      Math.ceil(((manualRefreshAvailableAt.value ?? clock.value) - clock.value) / 1000),
    )
    return `Available in ${seconds}s`
  }
  return syncStatus.value?.status === 'error' ? 'Try again' : 'Sync now'
})

const syncProgress = computed(() => Math.min(100, Math.max(0, syncStatus.value?.percent ?? 0)))

const syncProgressLabel = computed(() => {
  const loaded = syncStatus.value?.loaded ?? 0
  const total = syncStatus.value?.total ?? 0
  if (total <= 0) return 'Preparing synchronization…'
  return `${loaded.toLocaleString()} of ${total.toLocaleString()} records processed`
})

const syncTitle = computed(() => {
  const lastChecked = syncStatus.value?.last_source_checked_at
    ? new Date(syncStatus.value.last_source_checked_at).toLocaleString()
    : syncStatus.value?.last_synced_at
      ? new Date(syncStatus.value.last_synced_at).toLocaleString()
      : 'Never'
  const lastUpdated = syncStatus.value?.last_synced_at
    ? new Date(syncStatus.value.last_synced_at).toLocaleString()
    : 'Never'
  const statusDetails = `Google Sheet last checked: ${lastChecked}. Logbook data last updated: ${lastUpdated}.`
  if (refreshCoolingDown.value) {
    const seconds = Math.max(
      1,
      Math.ceil(((manualRefreshAvailableAt.value ?? clock.value) - clock.value) / 1000),
    )
    return `${statusDetails} Refresh available in ${seconds}s.`
  }
  return `Refresh logbook data from Google Sheet. ${statusDetails}`
})

async function onRefreshLogbook(): Promise<void> {
  if (isSyncing.value || refreshCoolingDown.value) return
  try {
    await requestSync()
    show('Updating logbook data from Google Sheet…', 'info')
  } catch (err) {
    show(isApiError(err) ? err.message : 'Could not refresh logbook data.', 'error')
  }
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
    userMenuOpen.value = false
    syncPanelOpen.value = false
  },
)

watch(syncCompleteCount, (count, previous) => {
  if (count > previous) closeSyncPanel()
})
</script>

<template>
  <div class="min-h-screen">
    <header v-if="!hideMobileChrome" class="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:h-16 lg:max-w-[1440px] lg:justify-start lg:gap-0 lg:px-8 lg:py-0"
      >
        <div class="flex min-w-0 items-center gap-3 sm:gap-6 lg:h-full lg:flex-1 lg:gap-8">
          <button
            v-if="user?.has_logbook"
            type="button"
            class="rounded-md p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
            aria-label="Open menu"
            :aria-expanded="menuOpen"
            @click="toggleMenu"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                v-if="!menuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <RouterLink
            to="/dashboard"
            class="flex min-w-0 items-center gap-2 truncate text-lg font-semibold text-sky-800 lg:shrink-0"
          >
            <GliderLogo size-class="h-8 w-8 shrink-0" />
            <span class="truncate">Glider Pilot Logbook</span>
          </RouterLink>
          <nav
            v-if="user?.has_logbook"
            class="hidden items-center gap-1 sm:flex lg:h-full lg:items-stretch lg:gap-5 xl:gap-6"
          >
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="rounded-md px-3 py-2 text-sm font-medium transition lg:relative lg:flex lg:items-center lg:self-stretch lg:whitespace-nowrap lg:rounded-none lg:px-0 lg:py-0 lg:hover:bg-transparent"
              :class="[
                item.desktopAccountOnly ? 'lg:hidden' : '',
                isActive(item.to)
                  ? 'bg-sky-100 text-sky-900 lg:bg-transparent lg:text-sky-700 lg:after:absolute lg:after:inset-x-0 lg:after:bottom-0 lg:after:h-[3px] lg:after:rounded-t lg:after:bg-current'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hover:text-slate-900',
              ]"
            >
              <span :class="item.desktopLabel ? 'lg:hidden' : ''">{{ item.label }}</span>
              <span v-if="item.desktopLabel" class="hidden lg:inline">{{ item.desktopLabel }}</span>
            </RouterLink>
          </nav>
        </div>
        <div
          v-if="user"
          class="relative flex shrink-0 items-center gap-2 text-sm sm:gap-3 lg:ml-auto lg:whitespace-nowrap"
        >
          <button
            v-if="user.has_logbook && !user.is_demo && !isSyncing"
            type="button"
            class="flex items-center gap-1.5 rounded-md px-1 py-1 text-xs font-semibold transition sm:px-2 sm:py-1.5"
            :class="{
              'text-emerald-700 hover:text-emerald-900':
                syncStatus?.status !== 'error' && !isSyncing && syncPillLabel === 'Up to date',
              'text-amber-700 hover:text-amber-900': syncStatus?.status === 'error',
              'text-slate-500 hover:text-slate-800': syncPillLabel === 'Not checked',
            }"
            :title="syncTitle"
            :aria-expanded="syncPanelOpen"
            aria-controls="logbook-sync-panel"
            @click="syncPanelOpen = !syncPanelOpen"
          >
            <span :class="{ 'animate-spin': isSyncing }" aria-hidden="true">{{
              syncPillIcon
            }}</span>
            <span class="hidden sm:inline">{{ syncPillLabel }}</span>
          </button>

          <button
            v-else-if="user.has_logbook && !user.is_demo"
            type="button"
            class="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-sky-50"
            :title="`${syncProgress}% synchronized. Open synchronization details.`"
            :aria-label="`${syncProgress}% synchronized. Open synchronization details.`"
            :aria-expanded="syncPanelOpen"
            aria-controls="logbook-sync-panel"
            @click="syncPanelOpen = !syncPanelOpen"
          >
            <svg
              class="h-7 w-7 -rotate-90"
              :class="{ 'animate-spin': (syncStatus?.total ?? 0) <= 0 }"
              viewBox="0 0 36 36"
              aria-hidden="true"
            >
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                class="text-sky-100"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                pathLength="100"
                :stroke-dasharray="(syncStatus?.total ?? 0) > 0 ? 100 : 25"
                :stroke-dashoffset="(syncStatus?.total ?? 0) > 0 ? 100 - syncProgress : 0"
                class="text-sky-700 transition-all duration-300"
              />
            </svg>
            <span
              v-if="(syncStatus?.total ?? 0) > 0"
              class="absolute text-[9px] font-semibold text-sky-800"
            >
              {{ syncProgress }}
            </span>
          </button>

          <button
            v-if="user.is_demo"
            type="button"
            class="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="mutating"
            @click="onLogout"
          >
            Exit demo
          </button>

          <div :class="user.has_logbook ? 'hidden sm:block' : 'block'">
            <button
              type="button"
              class="flex items-center gap-1 rounded-md px-2 py-2 text-slate-600 hover:bg-slate-100"
              :aria-expanded="userMenuOpen"
              aria-label="Open user menu"
              @click="userMenuOpen = !userMenuOpen"
            >
              <span class="hidden md:inline">{{ user.name }}</span>
              <svg
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div
              v-if="userMenuOpen"
              class="absolute right-0 top-full z-10 mt-2 w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg"
            >
              <RouterLink
                to="/profile"
                class="block rounded px-3 py-2 hover:bg-slate-100"
                @click="userMenuOpen = false"
                >Profile</RouterLink
              >
              <RouterLink
                to="/settings"
                class="block rounded px-3 py-2 hover:bg-slate-100"
                @click="userMenuOpen = false"
                >Settings</RouterLink
              >
              <button
                type="button"
                class="block w-full rounded px-3 py-2 text-left text-red-700 hover:bg-red-50"
                :disabled="mutating"
                @click="onLogout"
              >
                {{ user.is_demo ? 'Exit demo' : 'Log out' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <section
        v-if="syncPanelOpen && user?.has_logbook && !user.is_demo"
        id="logbook-sync-panel"
        class="border-t border-slate-100 bg-slate-50/80 px-4 py-3"
        aria-label="Google Sheet synchronization"
      >
        <div class="mx-auto flex max-w-6xl items-center gap-3 sm:gap-6 lg:max-w-[1440px] lg:px-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 text-sm">
              <span class="font-semibold text-slate-900">Google Sheet</span>
              <span
                class="truncate font-medium"
                :class="{
                  'text-emerald-700': syncStatus?.status !== 'error' && !isSyncing,
                  'text-sky-700': isSyncing,
                  'text-amber-700': syncStatus?.status === 'error',
                }"
              >
                {{ syncPillIcon }} {{ syncPillLabel }}
              </span>
            </div>
            <div v-if="isSyncing" class="mt-2 max-w-xl">
              <div
                class="h-1.5 overflow-hidden rounded-full bg-sky-100"
                role="progressbar"
                aria-label="Logbook synchronization progress"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-valuenow="(syncStatus?.total ?? 0) > 0 ? syncProgress : undefined"
              >
                <div
                  v-if="(syncStatus?.total ?? 0) > 0"
                  class="h-full rounded-full bg-sky-700 transition-all duration-300"
                  :style="{ width: `${syncProgress}%` }"
                />
                <div v-else class="h-full w-1/3 animate-pulse rounded-full bg-sky-600" />
              </div>
              <p class="mt-1 flex justify-between gap-3 text-xs text-sky-800">
                <span class="truncate">{{ syncProgressLabel }}</span>
                <span v-if="(syncStatus?.total ?? 0) > 0" class="shrink-0 font-semibold">
                  {{ syncProgress }}%
                </span>
              </p>
            </div>
            <p class="mt-0.5 truncate text-xs text-slate-500">
              Checked {{ lastCheckedLabel }} · Updated {{ lastUpdatedLabel }}
            </p>
            <p
              v-if="syncStatus?.status === 'error' && syncStatus.error"
              class="mt-1 truncate text-xs text-red-700"
            >
              {{ syncStatus.error }}
            </p>
          </div>

          <button
            v-if="!isSyncing"
            type="button"
            class="flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-sky-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
            :disabled="isSyncing || refreshCoolingDown"
            @click="onRefreshLogbook"
          >
            <span :class="{ 'animate-spin': isSyncing }" aria-hidden="true">↻</span>
            <span>{{ refreshActionLabel }}</span>
          </button>
        </div>
      </section>

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
          class="block w-full rounded-md px-3 py-3 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
          :disabled="mutating"
          @click="onLogout"
        >
          {{ user?.is_demo ? 'Exit demo' : 'Log out' }}
        </button>
      </nav>
    </header>

    <div
      v-if="user?.is_demo && !hideMobileChrome"
      class="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950"
      role="status"
    >
      <div
        class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 lg:max-w-[1440px]"
      >
        <span
          ><strong>Demo mode.</strong> You can explore the logbook, but changes are disabled.</span
        >
        <a
          v-if="user.demo_spreadsheet_url"
          :href="user.demo_spreadsheet_url"
          target="_blank"
          rel="noopener noreferrer"
          class="shrink-0 font-semibold text-amber-900 underline underline-offset-2"
        >
          Open read-only Google Sheet ↗
        </a>
      </div>
    </div>

    <div
      v-if="message && !hideMobileChrome"
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

    <main class="mx-auto max-w-6xl" :class="hideMobileChrome ? 'sm:px-4 sm:py-6' : 'px-4 py-6'">
      <slot />
    </main>

    <div v-if="!hideMobileChrome" class="border-t border-slate-200 bg-white px-4 py-6">
      <SiteFooter />
    </div>
  </div>
</template>
