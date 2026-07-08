<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { isApiError } from '@/api/errors'
import { useProfile } from '@/composables/useProfile'

const { profile, loading, error, fetch, save } = useProfile()

const preferencesJson = ref('{}')
const submitError = ref<string | null>(null)
const saving = ref(false)

const hasLogbook = computed(() => profile.value?.has_logbook ?? false)

onMounted(async () => {
  await fetch()
  if (profile.value) {
    preferencesJson.value = JSON.stringify(profile.value.preferences ?? {}, null, 2)
  }
})

async function onSubmit(): Promise<void> {
  submitError.value = null
  saving.value = true
  try {
    const preferences = JSON.parse(preferencesJson.value) as Record<string, unknown>
    await save({ preferences })
  } catch (err) {
    if (err instanceof SyntaxError) {
      submitError.value = 'Preferences must be valid JSON'
    } else if (isApiError(err)) {
      submitError.value = err.message
    } else {
      submitError.value = 'Failed to save profile'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Profile</h1>
      <p class="mt-1 text-slate-600">Your account and application preferences.</p>
    </div>

    <LoadingState v-if="loading && !profile" />
    <ErrorBanner v-else-if="error" :message="error" @retry="fetch" />
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

      <form class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" @submit.prevent="onSubmit">
        <h2 class="font-semibold text-slate-900">Preferences (JSON)</h2>
        <p class="mt-1 text-sm text-slate-600">Application-specific preferences stored on the server.</p>
        <textarea
          v-model="preferencesJson"
          rows="8"
          class="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
        />
        <button
          type="submit"
          class="mt-4 rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
          :disabled="saving"
        >
          {{ saving ? 'Saving…' : 'Save preferences' }}
        </button>
      </form>
    </div>
  </div>
</template>
