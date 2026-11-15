<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import PublicPageShell from '@/components/PublicPageShell.vue'
import { unsubscribe } from '@/api/notifications'
import { isApiError } from '@/api/errors'

const route = useRoute()

const token = computed(() => {
  const value = route.query.token
  return typeof value === 'string' && value ? value : null
})

const submitting = ref(false)
const success = ref(false)
const error = ref<string | null>(null)

// Unsubscribing only happens on an explicit click: email clients and link
// scanners open links automatically, and the email link is labelled
// "Manage email preferences", so opening the page must not change anything.
async function confirmUnsubscribe(): Promise<void> {
  if (!token.value || submitting.value) return
  submitting.value = true
  error.value = null
  try {
    await unsubscribe(token.value)
    success.value = true
  } catch (err) {
    error.value = isApiError(err) ? err.message : 'Could not unsubscribe. The link may have expired.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <PublicPageShell title="Email notifications">
    <ErrorBanner v-if="!token" message="This unsubscribe link is invalid or incomplete." />
    <div v-else-if="success" class="space-y-3 text-slate-700" data-testid="unsubscribe-success">
      <p class="text-lg font-medium text-slate-900">You have been unsubscribed.</p>
      <p>We will no longer send you reminder emails from Glider Pilot Logbook.</p>
      <p class="text-sm text-slate-600">
        You can turn notifications back on anytime in your
        <router-link to="/profile" class="text-sky-800 underline">profile settings</router-link>.
      </p>
    </div>
    <div v-else class="space-y-4 text-slate-700" data-testid="unsubscribe-confirm">
      <p class="text-lg font-medium text-slate-900">Email preferences</p>
      <p>
        Do you want to stop receiving reminder and news emails from Glider Pilot Logbook? Important
        account emails will still be sent.
      </p>
      <ErrorBanner v-if="error" :message="error" />
      <div class="flex flex-wrap items-center gap-3">
        <ActionButton
          variant="danger"
          :busy="submitting"
          data-action="confirm-unsubscribe"
          @click="confirmUnsubscribe"
        >
          Unsubscribe
        </ActionButton>
        <router-link to="/profile" class="text-sm text-sky-800 underline">
          Manage notifications in profile settings
        </router-link>
      </div>
    </div>
  </PublicPageShell>
</template>
