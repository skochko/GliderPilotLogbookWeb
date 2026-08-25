<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { listOrganizations, type OrganizationListItem } from '@/api/organizations'
import { useAuth } from '@/composables/useAuth'
import { useLogbook } from '@/composables/useLogbook'
import { usePilotPrivileges } from '@/composables/usePilotPrivileges'
import type { LogbookCreateResponse } from '@/types/logbookCreate'

const router = useRouter()
const route = useRoute()
const { user, fetchMe } = useAuth()
const { create, creationJob, mutating, error, resumeCreate, stopCreatePolling } = useLogbook()
const {
  options: pilotPrivilegeOptions,
  loading: loadingPilotPrivileges,
  load: loadPilotPrivileges,
  noticeForPrivilege,
} = usePilotPrivileges()
const pilotName = ref('')
const pilotPrivilege = ref('SPL Pilot')
const pilotPrivilegeNotice = computed(() => noticeForPrivilege(pilotPrivilege.value))
const organizationId = ref<number | null>(null)
const consent = ref(false)
const automationImportMode = ref<'all' | 'from_date'>('all')
const automationImportFromDate = ref('')
const creationResult = ref<LogbookCreateResponse | null>(null)
const showCreationFormAfterError = ref(false)
const organizations = ref<OrganizationListItem[]>([])
const loadingOrganizations = ref(true)
const validationError = ref<string | null>(null)
const organizationSlug = computed(() => String(route.params.organizationSlug ?? '').trim())
const stageLabels: Record<string, string> = {
  queued: 'Waiting to start…',
  preparing: 'Preparing your logbook…',
  copying_template: 'Copying the Google Sheets template…',
  applying_structure: 'Applying sheets, formulas, and protections…',
  connecting: 'Connecting your new logbook…',
  finishing: 'Finishing setup…',
  complete: 'Logbook created.',
}
const creationInProgress = computed(
  () => creationJob.value !== null && ['queued', 'running'].includes(creationJob.value.status),
)
const creationFailed = computed(
  () =>
    !creationResult.value &&
    !showCreationFormAfterError.value &&
    !creationInProgress.value &&
    Boolean(error.value),
)
const creationStageLabel = computed(() =>
  creationJob.value ? (stageLabels[creationJob.value.stage] ?? 'Creating your logbook…') : '',
)

onMounted(async () => {
  void loadPilotPrivileges()
  await prefillPilotName()
  void resumePreviouslyStartedCreation()
  try {
    organizations.value = await listOrganizations()
    if (organizationSlug.value) {
      const organization = organizations.value.find((item) => item.slug === organizationSlug.value)
      if (organization) {
        organizationId.value = organization.id
      } else {
        validationError.value = 'The club link is invalid or the club is unavailable.'
      }
    }
  } finally {
    loadingOrganizations.value = false
  }
})

async function prefillPilotName(): Promise<void> {
  if (pilotName.value.trim()) return

  const currentUser = user.value ?? (await fetchMe())
  if (!currentUser || currentUser.name.trim() === currentUser.email.trim()) return

  pilotName.value = currentUser.name.trim()
}

onUnmounted(() => {
  stopCreatePolling()
})

async function resumePreviouslyStartedCreation(): Promise<void> {
  const response = await resumeCreate()
  if (response) {
    await finishCreation(response)
  }
}

async function submit(): Promise<void> {
  validationError.value = null
  if (!pilotName.value.trim()) {
    validationError.value = 'Pilot name is required.'
    return
  }
  if (organizationId.value !== null && !consent.value) {
    validationError.value = 'Please confirm the club automation consent.'
    return
  }
  if (
    organizationId.value !== null &&
    automationImportMode.value === 'from_date' &&
    !automationImportFromDate.value
  ) {
    validationError.value = 'Select how far back club flights should be imported.'
    return
  }
  showCreationFormAfterError.value = false
  const response = await create({
    pilot_name: pilotName.value.trim(),
    pilot_privilege: pilotPrivilege.value,
    source: 'direct',
    organization_id: organizationId.value,
    automation_consent: consent.value,
    automation_import_from_date:
      automationImportMode.value === 'from_date' ? automationImportFromDate.value : null,
  })
  if (response) {
    await finishCreation(response)
  }
}

async function finishCreation(response: LogbookCreateResponse): Promise<void> {
  await fetchMe()
  creationResult.value = response
}

function continueToSetup(): void {
  void router.push('/logbook/setup')
}

function skipSetup(): void {
  void router.push('/dashboard')
}

function returnToCreationForm(): void {
  showCreationFormAfterError.value = true
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6 py-8">
    <section
      v-if="creationResult"
      class="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div class="rounded-lg bg-emerald-50 p-5">
        <h1 class="text-2xl font-bold text-emerald-950">Your logbook is ready!</h1>
        <p class="mt-2 text-emerald-900">
          Your Glider Pilot Logbook has been created successfully.
        </p>
      </div>

      <div class="space-y-3">
        <h2 class="text-lg font-semibold text-slate-900">Club automation</h2>
        <p
          v-if="creationResult.club_automation_request?.automation_supported"
          class="text-slate-700"
        >
          Your request to connect with
          {{ creationResult.club_automation_request.organization_name }} has been sent. We'll notify
          you when the club approves the connection and automatic synchronisation is available.
        </p>
        <p v-else-if="creationResult.club_automation_request" class="text-slate-700">
          {{ creationResult.club_automation_request.message }}
        </p>
        <p v-else class="text-slate-700">
          You did not set up club automation. You can configure it later from your account.
        </p>
      </div>

      <div class="space-y-2.5 border-t border-slate-200 pt-5">
        <h2 class="text-lg font-semibold text-slate-900">Your logbook is ready to use.</h2>
        <p class="text-slate-700">
          To get accurate statistics, legality calculations, and a complete flying history, you can
          complete a few optional setup steps.
        </p>
        <h3 class="pt-1 font-semibold text-slate-900">Getting started</h3>
        <ul class="space-y-1">
          <li class="flex items-center gap-3 py-1 text-sm text-emerald-900">
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs text-white"
            >
              ✓
            </span>
            <span>Logbook created</span>
          </li>
          <li class="flex items-center gap-3 py-1 text-sm text-emerald-900">
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs text-white"
            >
              ✓
            </span>
            <span>Personal details</span>
          </li>
          <li class="flex items-center gap-3 py-1 text-sm text-slate-700">
            <span class="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 bg-white" />
            <span>License</span>
          </li>
          <li class="flex items-center gap-3 py-1 text-sm text-slate-700">
            <span class="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 bg-white" />
            <span>Add Medical / PMD</span>
          </li>
          <li class="flex items-center gap-3 py-1 text-sm text-slate-700">
            <span class="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 bg-white" />
            <span>Totals from previous logbooks</span>
          </li>
          <li class="flex items-center gap-3 py-1 text-sm text-slate-700">
            <span class="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 bg-white" />
            <span>Training &amp; qualification events</span>
          </li>
        </ul>
        <p class="pt-1 text-sm text-slate-600">
          You can complete these steps later from your dashboard.
        </p>
      </div>

      <div
        class="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end"
      >
        <ActionButton type="button" variant="secondary" @click="skipSetup">
          Go to dashboard
        </ActionButton>
        <ActionButton type="button" @click="continueToSetup">Continue setup</ActionButton>
      </div>
    </section>

    <div v-if="!creationResult && !creationInProgress && !creationFailed">
      <h1 class="text-2xl font-bold text-slate-900">Create your logbook</h1>
      <p class="mt-2 text-slate-600">Enter your name, then optionally connect a club automation.</p>
      <div class="mt-5 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700">
        <p class="font-semibold text-slate-900">Already have a Glider Pilot Logbook?</p>
        <p class="mt-1">
          Connect your existing official-template spreadsheet instead of creating a new one.
        </p>
        <ActionButton
          type="button"
          class="mt-3"
          variant="secondary"
          @click="
            router.push({
              name: 'connect',
              query: organizationSlug ? { organization: organizationSlug } : {},
            })
          "
        >
          Connect existing logbook
        </ActionButton>
      </div>
    </div>
    <ErrorBanner
      v-if="!creationResult && !creationInProgress && validationError"
      :message="validationError"
    />
    <section
      v-if="!creationResult && creationInProgress"
      class="space-y-5 rounded-lg border border-sky-200 bg-sky-50 p-6 shadow-sm"
      aria-live="polite"
    >
      <div>
        <h1 class="text-2xl font-bold text-sky-950">Creating your logbook</h1>
        <p class="mt-2 text-sky-900">Please keep this page open while we finish the setup.</p>
      </div>
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="font-medium text-sky-950">{{ creationStageLabel }}</p>
        </div>
        <span class="text-sm font-medium text-sky-800">{{ creationJob?.percent ?? 0 }}%</span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-sky-100">
        <div
          class="h-full rounded-full bg-sky-600 transition-all duration-500"
          :style="{ width: `${Math.max(creationJob?.percent ?? 0, 5)}%` }"
        />
      </div>
      <p class="text-xs text-sky-700">This may take a few minutes. Please keep this page open.</p>
    </section>
    <section
      v-if="creationFailed"
      class="space-y-5 rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm"
      aria-live="assertive"
    >
      <div>
        <h1 class="text-2xl font-bold text-red-950">We could not create your logbook</h1>
        <p class="mt-2 text-red-900">
          Something went wrong while creating the logbook. Your form data is still available.
        </p>
      </div>
      <p class="rounded-md border border-red-200 bg-white/60 px-4 py-3 text-red-900">
        {{ error ?? 'Logbook creation failed.' }}
      </p>
      <ActionButton type="button" :busy="mutating" @click="returnToCreationForm">
        Try again
      </ActionButton>
    </section>
    <form
      v-if="!creationResult && !creationInProgress && !creationFailed"
      class="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="submit"
    >
      <section>
        <h2 class="text-lg font-semibold text-slate-900">1. Pilot name</h2>
        <label class="mt-3 block text-sm">
          <span class="font-medium text-slate-700">Name <span class="text-red-600">*</span></span>
          <input v-model="pilotName" type="text" class="field-control" required autofocus />
        </label>
        <label class="mt-3 block text-sm">
          <span class="font-medium text-slate-700">
            Pilot privilege <span class="text-red-600">*</span>
          </span>
          <select
            v-model="pilotPrivilege"
            class="field-control"
            :disabled="loadingPilotPrivileges"
            required
          >
            <option v-for="option in pilotPrivilegeOptions" :key="option.code" :value="option.code">
              {{ option.name }}
            </option>
          </select>
          <p
            v-if="pilotPrivilegeNotice"
            class="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            role="alert"
          >
            {{ pilotPrivilegeNotice }}
          </p>
        </label>
      </section>
      <section>
        <h2 class="text-lg font-semibold text-slate-900">2. Club automation (optional)</h2>
        <LoadingState v-if="loadingOrganizations" />
        <label v-else class="mt-3 block text-sm">
          <span class="font-medium text-slate-700">Club</span>
          <select v-model="organizationId" class="field-control">
            <option :value="null">No club for now</option>
            <option
              v-for="organization in organizations"
              :key="organization.id"
              :value="organization.id"
            >
              {{ organization.name }}
            </option>
          </select>
        </label>
        <label v-if="organizationId !== null" class="mt-4 block text-sm">
          <span class="font-medium text-slate-700">My flights to import</span>
          <span
            class="mt-2 flex gap-1.5 overflow-x-auto"
            role="radiogroup"
            aria-label="Import flights"
          >
            <button
              type="button"
              class="rounded-full px-3 py-1.5 text-sm font-medium transition"
              :class="
                automationImportMode === 'all'
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              "
              @click="automationImportMode = 'all'"
            >
              All flights
            </button>
            <button
              type="button"
              class="rounded-full px-3 py-1.5 text-sm font-medium transition"
              :class="
                automationImportMode === 'from_date'
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              "
              @click="automationImportMode = 'from_date'"
            >
              From date
            </button>
          </span>
        </label>
        <label
          v-if="organizationId !== null && automationImportMode === 'from_date'"
          class="mt-3 block text-sm"
        >
          <span class="font-medium text-slate-700">Import flights from</span>
          <input v-model="automationImportFromDate" type="date" class="field-control" required />
        </label>
        <label
          v-if="organizationId !== null"
          class="mt-4 flex items-start gap-3 text-sm text-slate-700"
        >
          <input v-model="consent" type="checkbox" class="mt-1" />
          <span
            >I agree that this club may receive access to my logbook to add flight records.</span
          >
        </label>
        <p v-if="organizationId !== null" class="mt-2 text-sm text-slate-500">
          Inactive clubs are recorded as interest only; no spreadsheet access is granted.
        </p>
      </section>
      <ActionButton type="submit" class="ml-auto" :busy="mutating">Create logbook</ActionButton>
    </form>
  </div>
</template>
