<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import LoadingState from '@/components/LoadingState.vue'
import { useAuth } from '@/composables/useAuth'

const { user, initialized, fetchMe } = useAuth()

onMounted(() => {
  if (!initialized.value) {
    void fetchMe()
  }
})
</script>

<template>
  <LoadingState v-if="!initialized" label="Starting app…" />
  <AppShell v-else-if="user">
    <RouterView />
  </AppShell>
  <RouterView v-else />
</template>
