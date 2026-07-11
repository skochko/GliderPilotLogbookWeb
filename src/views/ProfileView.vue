<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { isApiError } from '@/api/errors'
import { useProfile } from '@/composables/useProfile'

const { profile, loading, initialized, mutating, error, fetch, save } = useProfile()

const preferencesJson = ref('{}')
const emailNotificationsEnabled = ref(true)
const language = ref<'' | 'en' | 'ru'>('')
const submitError = ref<string | null>(null)

const hasLogbook = computed(() => profile.value?.has_logbook ?? false)

onMounted(async () => {
  await fetch()
  if (profile.value) {
    preferencesJson.value = JSON.stringify(profile.value.preferences ?? {}, null, 2)
    emailNotificationsEnabled.value = profile.value.email_notifications_enabled
    language.value = profile.value.language ?? ''
  }
})

async function onSubmit(): Promise<void> {
  if (mutating.value) return

  submitError.value = null
  try {
    const preferences = JSON.parse(preferencesJson.value) as Record<string, unknown>
    await save({
      preferences,
      email_notifications_enabled: emailNotificationsEnabled.value,
      language: language.value,
    })
  } catch (err) {
    if (err instanceof SyntaxError) {
      submitError.value = 'Preferences must be valid JSON'
    } else if (isApiError(err)) {
      submitError.value = err.message
    } else {
      submitError.value = 'Failed to save profile'
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Profile</h1>
      <p class="mt-1 text-slate-600">Your account and application preferences.</p>
    </div>

    <LoadingState v-if="!initialized" />
    <ErrorBanner v-else-if="error" :message="error" :retry-busy="loading" @retry="fetch" />
    <ErrorBanner v-if="submitError" :message="submitError" />

    <div v-if="profile" class="space-y-6">
      <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="font-semibold text-slate-900">Account</h2>
        <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-slate-500">Email</dt>
            <dd class="font-medium text-slate-900">{{ profile.email }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Logbook connected</dt>
            <dd class="font-medium text-slate-900">{{ hasLogbook ? 'Yes' : 'No' }}</dd>
          </div>
          <div v-if="profile.spreadsheet_id" class="sm:col-span-2">
            <dt class="text-slate-500">Spreadsheet ID</dt>
            <dd class="break-all font-mono text-xs text-slate-700">{{ profile.spreadsheet_id }}</dd>
          </div>
        </dl>
      </section>

      <form class="space-y-6" @submit.prevent="onSubmit">
        <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="font-semibold text-slate-900">Email notifications</h2>
          <p class="mt-1 text-sm text-slate-600">
            Reminders about medical expiry, compliance, and template updates.
          </p>
          <label class="mt-4 flex items-center gap-3 text-sm text-slate-700">
            <input
              v-model="emailNotificationsEnabled"
              type="checkbox"
              class="size-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
            />
            <span>Send me email reminders</span>
          </label>
          <div class="mt-4">
            <label for="language" class="block text-sm font-medium text-slate-700">Email language</label>
            <select
              id="language"
              v-model="language"
              class="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Default (English)</option>
              <option value="en">English</option>
              <option value="ru">Russian</option>
            </select>
          </div>
        </section>

        <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="font-semibold text-slate-900">Preferences (JSON)</h2>
          <p class="mt-1 text-sm text-slate-600">Application-specific preferences stored on the server.</p>
          <textarea
            v-model="preferencesJson"
            rows="8"
            class="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
          />
        </section>

        <ActionButton type="submit" :busy="mutating">Save profile</ActionButton>
      </form>
    </div>
  </div>
</template>
