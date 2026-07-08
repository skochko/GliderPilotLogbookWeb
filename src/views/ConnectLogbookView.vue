<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import { useAuth } from '@/composables/useAuth'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useGooglePicker } from '@/composables/useGooglePicker'
import { useLogbook } from '@/composables/useLogbook'

const router = useRouter()
const { fetchMe } = useAuth()
const { connect, mutating, error } = useLogbook()
const { pickSpreadsheet } = useGooglePicker()
const { show } = useFlashMessage()

const urlInput = ref('')
const pickerError = ref<string | null>(null)
const pickerBusy = ref(false)
const urlBusy = ref(false)

async function connectByUrl(): Promise<void> {
  if (urlBusy.value || pickerBusy.value) return

  const value = urlInput.value.trim()
  if (!value) return

  const payload = value.includes('docs.google.com') || value.includes('spreadsheets')
    ? { url: value }
    : { spreadsheet_id: value }

  urlBusy.value = true
  try {
    const ok = await connect(payload)
    if (ok) {
      await fetchMe()
      show('Logbook connected successfully.', 'success')
      await router.push('/')
    }
  } finally {
    urlBusy.value = false
  }
}

async function connectByPicker(): Promise<void> {
  if (urlBusy.value || pickerBusy.value) return

  pickerError.value = null
  pickerBusy.value = true
  try {
    const picked = await pickSpreadsheet()
    if (!picked) return
    const ok = await connect({ spreadsheet_id: picked.id })
    if (ok) {
      await fetchMe()
      show('Logbook connected successfully.', 'success')
      await router.push('/')
    }
  } catch (err) {
    pickerError.value = err instanceof Error ? err.message : 'Picker failed'
  } finally {
    pickerBusy.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl space-y-8 py-8">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Connect your logbook</h1>
      <p class="mt-2 text-slate-600">
        Select your GliderPilotLogbookSync spreadsheet or paste its URL to get started.
      </p>
    </div>

    <ErrorBanner v-if="error" :message="error" :retry-busy="urlBusy || mutating" @retry="connectByUrl" />
    <ErrorBanner
      v-if="pickerError"
      :message="pickerError"
      :retry-busy="pickerBusy"
      @retry="connectByPicker"
    />

    <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="font-semibold text-slate-900">Google Drive Picker</h2>
      <p class="mt-1 text-sm text-slate-600">Recommended — browse and select your spreadsheet.</p>
      <ActionButton
        class="mt-4"
        :busy="pickerBusy"
        :disabled="urlBusy || mutating"
        @click="connectByPicker"
      >
        Choose spreadsheet
      </ActionButton>
    </section>

    <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="font-semibold text-slate-900">Paste URL or spreadsheet ID</h2>
      <p class="mt-1 text-sm text-slate-600">
        Alternative if the picker is unavailable.
      </p>
      <form class="mt-4 space-y-3" @submit.prevent="connectByUrl">
        <input
          v-model="urlInput"
          type="text"
          placeholder="https://docs.google.com/spreadsheets/d/… or spreadsheet ID"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          :disabled="urlBusy || pickerBusy || mutating"
        />
        <ActionButton
          type="submit"
          variant="secondary"
          :busy="urlBusy || mutating"
          :disabled="pickerBusy || !urlInput.trim()"
        >
          Connect
        </ActionButton>
      </form>
    </section>
  </div>
</template>
