<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import PublicPageShell from '@/components/PublicPageShell.vue'
import { unsubscribe } from '@/api/notifications'
import { isApiError } from '@/api/errors'

const route = useRoute()

const loading = ref(true)
const success = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  const token = route.query.token
  if (typeof token !== 'string' || !token) {
    loading.value = false
    error.value = 'This unsubscribe link is invalid or incomplete.'
    return
  }

  try {
    await unsubscribe(token)
    success.value = true
  } catch (err) {
    error.value = isApiError(err) ? err.message : 'Could not unsubscribe. The link may have expired.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <PublicPageShell title="Email notifications">
    <LoadingState v-if="loading" />
    <div v-else-if="success" class="space-y-3 text-slate-700">
      <p class="text-lg font-medium text-slate-900">You have been unsubscribed.</p>
      <p>We will no longer send you reminder emails from Glider Pilot Logbook.</p>
      <p class="text-sm text-slate-600">
        You can turn notifications back on anytime in your
        <router-link to="/profile" class="text-sky-800 underline">profile settings</router-link>.
      </p>
    </div>
    <ErrorBanner v-else-if="error" :message="error" />
  </PublicPageShell>
</template>
