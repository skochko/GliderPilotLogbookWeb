<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import LoadingState from '@/components/LoadingState.vue'
import ToastNotice from '@/components/ToastNotice.vue'
import { useAuth } from '@/composables/useAuth'
import { isPublicFastPath } from '@/lib/routeAccess'

const AppShell = defineAsyncComponent(() => import('@/components/AppShell.vue'))
const EssentialCookiesNotice = defineAsyncComponent(
  () => import('@/components/EssentialCookiesNotice.vue'),
)

const { user, initialized } = useAuth()
const route = useRoute()

const useAppShell = computed(() => Boolean(user.value) && !route.meta.publicPage)
const publicFastPath = computed(() => isPublicFastPath(route.meta))
const showBootstrapLoading = computed(() => !initialized.value && !publicFastPath.value)
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
