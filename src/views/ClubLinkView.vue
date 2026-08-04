<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import {
  getClubLinkContext,
  requestClubLinkAutomation,
  type ClubLinkContext,
} from '@/api/logbook'
import { useAuth } from '@/composables/useAuth'
import { useLogbook } from '@/composables/useLogbook'

const route = useRoute()
const router = useRouter()
const { user, fetchMe } = useAuth()
const { create, mutating, error } = useLogbook()
const context = ref<ClubLinkContext | null>(null)
const pilotName = ref('')
const consent = ref(false)
const loading = ref(true)
const loadError = ref<string | null>(null)
const validationError = ref<string | null>(null)

onMounted(async () => {
  try {
    context.value = await getClubLinkContext(String(route.params.token))
  } catch {
    loadError.value = 'This club link is no longer valid.'
  } finally {
    loading.value = false
  }
})

async function submit(): Promise<void> {
  validationError.value = null
  if (!consent.value) {
    validationError.value = 'Please confirm the club automation consent.'
    return
  }
  if (!user.value?.has_logbook && !pilotName.value.trim()) {
    validationError.value = 'Pilot name is required.'
    return
  }
  const response = user.value?.has_logbook
    ? await requestClubLinkAutomation(String(route.params.token), { consent: true })
    : await create({
        pilot_name: pilotName.value.trim(),
        source: 'club_link',
        organization_id: context.value?.organization_id,
        automation_consent: true,
      })
  if (response) {
    await fetchMe()
    await router.push('/dashboard')
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl space-y-6 py-8">
    <LoadingState v-if="loading" />
    <template v-else-if="context">
      <h1 class="text-2xl font-bold text-slate-900">{{ context.name }}</h1>
      <ErrorBanner v-if="loadError || error" :message="loadError || error || ''" />
      <ErrorBanner v-if="validationError" :message="validationError" />
      <form class="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" @submit.prevent="submit">
        <p class="text-slate-600">
          The club will receive access to your logbook to add flight records. Your spreadsheet ID is not
          exposed by this link.
        </p>
        <label v-if="!user?.has_logbook" class="block text-sm">
          <span class="font-medium text-slate-700">Pilot name</span>
          <input v-model="pilotName" type="text" class="field-control" required />
        </label>
        <label class="flex items-start gap-3 text-sm text-slate-700">
          <input v-model="consent" type="checkbox" class="mt-1" />
          <span>I agree to connect my logbook to {{ context.name }}.</span>
        </label>
        <ActionButton type="submit" :busy="mutating">Continue</ActionButton>
      </form>
    </template>
    <ErrorBanner v-else :message="loadError || 'Club link not found.'" />
  </div>
</template>
