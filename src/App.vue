<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import EssentialCookiesNotice from '@/components/EssentialCookiesNotice.vue'
import LoadingState from '@/components/LoadingState.vue'
import ToastNotice from '@/components/ToastNotice.vue'
import { useAuth } from '@/composables/useAuth'

const { user, initialized, fetchMe } = useAuth()
const route = useRoute()

const useAppShell = computed(() => Boolean(user.value) && !route.meta.publicPage)

onMounted(() => {
  if (!initialized.value) {
    void fetchMe()
  }
})
</script>

<template>
  <ToastNotice />
  <EssentialCookiesNotice />
  <LoadingState v-if="!initialized" label="Starting app…" />
  <AppShell v-else-if="useAppShell">
    <RouterView />
  </AppShell>
  <RouterView v-else />
</template>
