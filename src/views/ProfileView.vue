<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { isApiError } from '@/api/errors'
import { fetchGoogleScopes, googleReconnectRedirect, type GoogleScopeStatus } from '@/api/auth'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useAuth } from '@/composables/useAuth'
import { useLogbookDisconnect } from '@/composables/useLogbookDisconnect'
import { useProfile } from '@/composables/useProfile'
import { useMeasurementUnits } from '@/composables/useMeasurementUnits'
import { measurementUnitsFromPreferences, type MeasurementUnits } from '@/lib/measurementUnits'

const route = useRoute()
const router = useRouter()
const { show } = useFlashMessage()
const { user } = useAuth()
const { profile, loading, initialized, mutating, error, fetch, save } = useProfile()
const { syncFromProfile: syncMeasurementUnits, setUnitsLocally } = useMeasurementUnits()
const { disconnectLogbook, disconnecting } = useLogbookDisconnect()

const disconnectOpen = ref(false)

const preferences = ref<Record<string, unknown>>({})
const emailNotificationsEnabled = ref(true)
const language = ref<'' | 'en' | 'ru'>('')
const measurementUnits = ref<MeasurementUnits>('metric')
const submitError = ref<string | null>(null)
const googleScopes = ref<GoogleScopeStatus | null>(null)
const scopesLoading = ref(false)
const scopesError = ref<string | null>(null)
const googleAccessError = ref<string | null>(null)

const hasLogbook = computed(() => profile.value?.has_logbook ?? false)
const isDemo = computed(() => user.value?.is_demo ?? false)
const needsGoogleReconnect = computed(
  () => hasLogbook.value && googleScopes.value !== null && !googleScopes.value.available,
)

function onMeasurementUnitsChange(): void {
  if (isDemo.value) setUnitsLocally(measurementUnits.value)
}

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
  ]
})

async function loadGoogleScopes(): Promise<void> {
  if (isDemo.value) {
    googleScopes.value = {
      available: false,
      scopes: [],
      sign_in: false,
      drive_file: false,
    }
    return
  }
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
    googleAccessError.value =
      'You signed in with a different Google account. Use the same account as your logbook and try again.'
    return
  }
  googleAccessError.value = 'Could not restore Google access. Please try again.'
}

onMounted(async () => {
  await fetch()
  if (profile.value) {
    preferences.value = profile.value.preferences ?? {}
    emailNotificationsEnabled.value = profile.value.email_notifications_enabled
    language.value = profile.value.language ?? ''
    measurementUnits.value = measurementUnitsFromPreferences(profile.value.preferences)
  }
  await loadGoogleScopes()
  await handleReconnectQuery()
})

watch(
  () => route.query.google_reconnect,
  () => {
    void handleReconnectQuery()
  },
)

async function onSubmit(): Promise<void> {
  if (mutating.value || isDemo.value) return

  submitError.value = null
  try {
    await save({
      preferences: { ...preferences.value, measurement_units: measurementUnits.value },
      email_notifications_enabled: emailNotificationsEnabled.value,
      language: language.value,
    })
    syncMeasurementUnits()
  } catch (err) {
    if (isApiError(err)) {
      submitError.value = err.message
    } else {
      submitError.value = 'Failed to save profile'
    }
  }
}

async function confirmDisconnect(): Promise<void> {
  if (isDemo.value) return
  const ok = await disconnectLogbook()
  if (ok) {
    disconnectOpen.value = false
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
        <div v-if="hasLogbook" class="mt-6 border-t border-slate-200 pt-6">
          <h3 class="text-sm font-semibold text-slate-900">Disconnect logbook</h3>
          <p class="mt-1 text-sm text-slate-600">
            Remove the link between this app and your spreadsheet. Your data in Google Sheets is not
            deleted.
          </p>
          <ActionButton
            type="button"
            variant="secondary"
            class="mt-4"
            :busy="disconnecting"
            :disabled="isDemo || disconnecting"
            @click="disconnectOpen = true"
          >
            Disconnect logbook
          </ActionButton>
        </div>
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
        <ErrorBanner v-if="googleAccessError" class="mt-4" :message="googleAccessError" />
        <template v-else-if="googleScopes?.available">
          <ul class="mt-4 space-y-3 text-sm">
            <li v-for="item in googleAccessItems" :key="item.key" class="flex items-start gap-3">
              <span
                class="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                :class="
                  item.granted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
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
        </template>

        <div
          v-else-if="needsGoogleReconnect"
          class="mt-4 space-y-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-950"
        >
          <p>
            Google access is not connected. Sign in with Google again to use your logbook — you only
            need per-file access to your spreadsheet, not full Drive.
          </p>
          <ActionButton
            type="button"
            :disabled="isDemo"
            @click="googleReconnectRedirect('/profile')"
          >
            Reconnect Google
          </ActionButton>
        </div>
      </section>

      <form class="space-y-6" @submit.prevent="onSubmit">
        <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="font-semibold text-slate-900">Measurement units</h2>
          <p class="mt-1 text-sm text-slate-600">
            Choose how distances, altitudes, and vertical speeds are displayed.
          </p>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <label
              v-for="option in [
                { value: 'metric', label: 'SI (metric)', detail: 'km, m, m/s' },
                { value: 'imperial', label: 'Imperial', detail: 'mi, ft, ft/min' },
              ]"
              :key="option.value"
              class="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 px-4 py-3 text-sm"
              :class="measurementUnits === option.value ? 'border-sky-600 bg-sky-50' : ''"
            >
              <input
                v-model="measurementUnits"
                type="radio"
                name="measurement-units"
                :value="option.value"
                class="size-4 border-slate-300 text-sky-700 focus:ring-sky-600"
                @change="onMeasurementUnitsChange"
              />
              <span>
                <span class="block font-medium text-slate-900">{{ option.label }}</span>
                <span class="text-slate-500">{{ option.detail }}</span>
              </span>
            </label>
          </div>
        </section>

        <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="font-semibold text-slate-900">Email notifications</h2>
          <p class="mt-1 text-sm text-slate-600">
            Reminders about medical expiry, compliance, and template updates.
          </p>
          <label class="mt-4 flex items-center gap-3 text-sm text-slate-700">
            <input
              v-model="emailNotificationsEnabled"
              type="checkbox"
              :disabled="isDemo"
              class="size-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
            />
            <span>Send me email reminders</span>
          </label>
        </section>

        <ActionButton type="submit" :busy="mutating" :disabled="isDemo || mutating">
          Save profile
        </ActionButton>
      </form>
    </div>

    <ConfirmDialog
      :open="disconnectOpen"
      title="Disconnect logbook"
      message="You will no longer see flights from this spreadsheet in the app. Your data in Google Sheets is not deleted."
      confirm-label="Disconnect"
      :busy="disconnecting"
      @confirm="confirmDisconnect"
      @cancel="disconnectOpen = false"
    />
  </div>
</template>
