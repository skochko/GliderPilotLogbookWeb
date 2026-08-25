<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import { useAuth } from '@/composables/useAuth'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useGooglePicker } from '@/composables/useGooglePicker'
import { useLogbook } from '@/composables/useLogbook'

const router = useRouter()
const route = useRoute()
const { fetchMe } = useAuth()
const { connect, mutating, error } = useLogbook()
const { pickSpreadsheet } = useGooglePicker()
const { show } = useFlashMessage()

const pickerError = ref<string | null>(null)
const pickerBusy = ref(false)
const organizationSlug = computed(() => {
  const value = route.query.organization
  return typeof value === 'string' ? value.trim() : ''
})
const createLogbookDestination = computed(() =>
  organizationSlug.value
    ? { name: 'logbook-create', params: { organizationSlug: organizationSlug.value } }
    : { name: 'logbook-create' },
)

const compatibilityDetails = useTemplateRef<HTMLDetailsElement>('compatibilityDetails')
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'
let desktopMediaQuery: MediaQueryList | null = null

function syncCompatibilityPanel(): void {
  const panel = compatibilityDetails.value
  if (!panel || !desktopMediaQuery) return
  panel.open = desktopMediaQuery.matches
}

onMounted(() => {
  desktopMediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
  syncCompatibilityPanel()
  desktopMediaQuery.addEventListener('change', syncCompatibilityPanel)
})

onUnmounted(() => {
  desktopMediaQuery?.removeEventListener('change', syncCompatibilityPanel)
})

async function connectByPicker(): Promise<void> {
  if (pickerBusy.value) return

  pickerError.value = null
  pickerBusy.value = true
  try {
    const picked = await pickSpreadsheet()
    if (!picked) return
    const ok = await connect({ spreadsheet_id: picked.id })
    if (ok) {
      await fetchMe()
      show('Logbook connected successfully.', 'success')
      await router.push(
        organizationSlug.value
          ? { name: 'automation', query: { organization: organizationSlug.value } }
          : { name: 'dashboard' },
      )
    }
  } catch (err) {
    pickerError.value = err instanceof Error ? err.message : 'Picker failed'
  } finally {
    pickerBusy.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6 py-8">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Get started with Glider Pilot Logbook</h1>
    </div>

    <ErrorBanner
      v-if="error"
      :message="error"
      :retry-busy="pickerBusy || mutating"
      @retry="connectByPicker"
    />
    <ErrorBanner
      v-if="pickerError"
      :message="pickerError"
      :retry-busy="pickerBusy"
      @retry="connectByPicker"
    />

    <section class="rounded-lg border border-sky-300 bg-sky-50 p-6 shadow-sm sm:p-8">
      <p class="text-sm font-medium uppercase tracking-wide text-sky-800">New here?</p>
      <h2 class="mt-1 text-xl font-semibold text-slate-900">Create from the official template</h2>
      <p class="mt-2 text-sm text-slate-600">
        Copy the Glider Pilot Logbook template into your Google Drive and enter your pilot details.
        We’ll guide you through each step.
      </p>
      <ActionButton class="mt-5" @click="router.push(createLogbookDestination)">
        Create logbook
      </ActionButton>
    </section>

    <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-slate-900">
        Do you already have a Glider Pilot Logbook spreadsheet?
      </h2>
      <p class="mt-2 text-sm text-slate-600">
        Choose this if you previously copied the official template — on this site or in Google Drive
        — and want to connect that spreadsheet now.
      </p>
      <details
        ref="compatibilityDetails"
        class="group mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-slate-700"
        aria-label="Template compatibility"
      >
        <summary
          class="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-slate-900 md:cursor-default md:pointer-events-none [&::-webkit-details-marker]:hidden"
        >
          <span>Which spreadsheets can I connect?</span>
          <span
            class="inline-flex shrink-0 items-center gap-1 text-xs font-normal text-sky-700 md:hidden"
            aria-hidden="true"
          >
            <span class="group-open:hidden">Show</span>
            <span class="hidden group-open:inline">Hide</span>
            <svg
              class="size-4 transition-transform group-open:rotate-180"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
        </summary>
        <p class="mt-2">
          You can connect a spreadsheet created from the
          <RouterLink
            to="/logbook/create/manual-guide"
            class="font-medium text-sky-700 hover:text-sky-800"
          >
            official Glider Pilot Logbook template</RouterLink
          >, either through this site or by copying it in Google Drive.
        </p>
        <p class="mt-2 text-amber-950">
          Custom logbook layouts, club sheets, Excel imports and other spreadsheet formats cannot be
          connected directly.
        </p>
      </details>
      <p class="mt-3 text-sm font-medium text-slate-800">
        Yes — I already use the official template
      </p>
      <p class="mt-1 text-sm text-slate-600">
        Select the spreadsheet in your <strong>Glider Pilot Logbook</strong> folder in Google Drive.
      </p>
      <ActionButton
        class="mt-4"
        variant="secondary"
        :busy="pickerBusy"
        :disabled="mutating"
        @click="connectByPicker"
      >
        Connect existing logbook
      </ActionButton>
      <p class="mt-3 text-xs text-slate-500">
        Need the template first?
        <RouterLink
          :to="createLogbookDestination"
          class="font-medium text-sky-700 hover:text-sky-800"
        >
          Create from template
        </RouterLink>
        instead.
      </p>
    </section>
  </div>
</template>
