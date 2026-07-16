<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import EssentialCookiesNotice from '@/components/EssentialCookiesNotice.vue'
import LoadingState from '@/components/LoadingState.vue'
import ToastNotice from '@/components/ToastNotice.vue'
import { useAuth } from '@/composables/useAuth'
import { isPublicFastPath } from '@/lib/routeAccess'

const { user, initialized } = useAuth()
const route = useRoute()

const useAppShell = computed(() => Boolean(user.value) && !route.meta.publicPage)
const publicFastPath = computed(() => isPublicFastPath(route.meta))
const showBootstrapLoading = computed(() => !initialized.value && !publicFastPath.value)

watch(
  () => route.name,
  (name) => {
    if (name && name !== 'landing') {
      document.documentElement.classList.add('gpl-vue-active')
    }
  },
  { immediate: true },
)
</script>

<template>
  <ToastNotice />
  <EssentialCookiesNotice />
  <LoadingState v-if="showBootstrapLoading" label="Starting app…" />
  <AppShell v-else-if="useAppShell">
    <RouterView />
  </AppShell>
  <RouterView v-else />
</template>
