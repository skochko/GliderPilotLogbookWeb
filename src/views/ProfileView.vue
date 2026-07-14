<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { isApiError } from '@/api/errors'
import {
  fetchGoogleScopes,
  googleReconnectRedirect,
  revokeGoogleAccess,
  type GoogleScopeStatus,
} from '@/api/auth'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useProfile } from '@/composables/useProfile'

const route = useRoute()
const router = useRouter()
const { show } = useFlashMessage()
const { profile, loading, initialized, mutating, error, fetch, save } = useProfile()

const preferencesJson = ref('{}')
const emailNotificationsEnabled = ref(true)
const language = ref<'' | 'en' | 'ru'>('')
const submitError = ref<string | null>(null)
const googleScopes = ref<GoogleScopeStatus | null>(null)
const scopesLoading = ref(false)
const scopesError = ref<string | null>(null)
const revokeBusy = ref(false)
const revokeError = ref<string | null>(null)

const hasLogbook = computed(() => profile.value?.has_logbook ?? false)
const showRevokeFullDriveFlow = computed(
  () => hasLogbook.value && googleScopes.value?.available && googleScopes.value.full_drive,
)
const needsGoogleReconnect = computed(
  () => hasLogbook.value && googleScopes.value !== null && !googleScopes.value.available,
)

const googleAccessItems = computed(() => {
  const scopes = googleScopes.value
  if (!scopes?.available) return []

  return [
    {
      key: 'sign_in',
      label: 'Google sign-in',
      description: 'Authenticate with your Google account',
      granted: scopes.sign_in,
    },
    {
      key: 'drive_file',
      label: 'Per-file Drive access',
      description: 'Read and update your logbook spreadsheet only',
      granted: scopes.drive_file,
    },
    {
      key: 'full_drive',
      label: 'Full Google Drive access',
      description: 'Needed only to create a logbook automatically from our template',
      granted: scopes.full_drive,
    },
  ]
})

async function loadGoogleScopes(): Promise<void> {
  scopesLoading.value = true
  scopesError.value = null
  try {
    googleScopes.value = await fetchGoogleScopes()
  } catch (err) {
    scopesError.value = isApiError(err) ? err.message : 'Could not load Google access status.'
  } finally {
    scopesLoading.value = false
  }
}

async function handleRevokeFullDriveAccess(): Promise<void> {
  if (revokeBusy.value) return

  revokeError.value = null
  revokeBusy.value = true
  try {
    await revokeGoogleAccess()
    await loadGoogleScopes()
    show(
      'Google access removed. Reconnect with Google to continue using your logbook.',
      'info',
    )
  } catch (err) {
    revokeError.value = isApiError(err) ? err.message : 'Could not remove Google access.'
  } finally {
    revokeBusy.value = false
  }
}

async function handleReconnectQuery(): Promise<void> {
  const reconnect = route.query.google_reconnect
  if (reconnect !== 'success' && reconnect !== 'error' && reconnect !== 'account_mismatch') {
    return
  }

  await router.replace({ path: route.path })
  if (reconnect === 'success') {
    await loadGoogleScopes()
    show('Google access restored with per-file Drive access only.', 'success')
    return
  }
  if (reconnect === 'account_mismatch') {
    revokeError.value =
      'You signed in with a different Google account. Use the same account as your logbook and try again.'
    return
  }
  revokeError.value = 'Could not restore Google access. Please try again.'
}

onMounted(async () => {
  await fetch()
  if (profile.value) {
    preferencesJson.value = JSON.stringify(profile.value.preferences ?? {}, null, 2)
    emailNotificationsEnabled.value = profile.value.email_notifications_enabled
    language.value = profile.value.language ?? ''
  }
  await loadGoogleScopes()
  await handleReconnectQuery()
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
          <div v-if="hasLogbook && profile.spreadsheet_url" class="sm:col-span-2">
            <dt class="text-slate-500">Logbook in Google</dt>
            <dd class="mt-2 flex flex-wrap gap-3">
              <a
                :href="profile.spreadsheet_url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-sky-800 hover:bg-slate-100 hover:text-sky-900"
              >
                Open spreadsheet
              </a>
              <a
                v-if="profile.drive_folder_url"
                :href="profile.drive_folder_url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-sky-800 hover:bg-slate-100 hover:text-sky-900"
              >
                Open folder in Drive
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="font-semibold text-slate-900">Google access</h2>
        <p class="mt-1 text-sm text-slate-600">
          Permissions this app currently has in your Google Account.
        </p>

        <LoadingState v-if="scopesLoading" class="mt-4" label="Checking Google access…" />
        <ErrorBanner
          v-else-if="scopesError"
          class="mt-4"
          :message="scopesError"
          :retry-busy="scopesLoading"
          @retry="loadGoogleScopes"
        />
        <ErrorBanner v-if="revokeError" class="mt-4" :message="revokeError" />
        <template v-else-if="googleScopes?.available">
          <ul class="mt-4 space-y-3 text-sm">
            <li
              v-for="item in googleAccessItems"
              :key="item.key"
              class="flex items-start gap-3"
            >
              <span
                class="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                :class="
                  item.granted
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
                "
                :aria-label="item.granted ? 'Granted' : 'Not granted'"
              >
                {{ item.granted ? '✓' : '–' }}
              </span>
              <span>
                <span class="font-medium text-slate-900">{{ item.label }}</span>
                <span class="mt-0.5 block text-slate-600">{{ item.description }}</span>
              </span>
            </li>
          </ul>

          <div
            v-if="showRevokeFullDriveFlow"
            class="mt-4 space-y-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950"
          >
            <p>
              Your logbook is already set up. Full Google Drive access is no longer needed for daily
              use. You can remove it here and keep only per-file access to your logbook spreadsheet.
            </p>
            <p>
              <strong>Important:</strong> removing access revokes <em>all</em> Google permissions for
              this app — not only full Drive. You will need to
              <strong>sign in with Google again</strong> afterwards (per-file access only, not your
              entire Drive). You stay signed in to this website; only the Google link is reset.
            </p>
            <div class="flex flex-wrap items-center gap-3">
              <ActionButton type="button" :busy="revokeBusy" @click="handleRevokeFullDriveAccess">
                Remove Google access
              </ActionButton>
              <RouterLink
                to="/help/google-drive-access"
                class="font-medium text-sky-800 underline hover:text-sky-900"
              >
                Manual steps in Google Account
              </RouterLink>
            </div>
          </div>
        </template>

        <div
          v-else-if="needsGoogleReconnect"
          class="mt-4 space-y-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-950"
        >
          <p>
            Google access is not connected. Sign in with Google again to use your logbook — you only
            need per-file access to your spreadsheet, not full Drive.
          </p>
          <ActionButton type="button" @click="googleReconnectRedirect('/profile')">
            Reconnect Google
          </ActionButton>
        </div>
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
