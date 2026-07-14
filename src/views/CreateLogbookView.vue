<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import MarkdownContent from '@/components/MarkdownContent.vue'
import { getSettings } from '@/api/settings'
import { createLogbookAuthRedirect, fetchCreateLogbookScopes } from '@/api/auth'
import { getPage } from '@/api/pages'
import { listOrganizations, type OrganizationListItem } from '@/api/organizations'
import { useAuth } from '@/composables/useAuth'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useGooglePicker } from '@/composables/useGooglePicker'
import { useLogbook } from '@/composables/useLogbook'
import {
  type CreateLogbookMode,
  clearCreateLogbookWizardState,
  consumeCreateLogbookPendingSubmit,
  loadCreateLogbookWizardState,
  saveCreateLogbookWizardState,
} from '@/lib/createLogbookWizardStorage'
import { ORGANIZATION_AUTOMATION_FORM_NOTICE } from '@/lib/organizations'
import {
  applySheetSettingsToCreateForm,
  buildLogbookCreatePayload,
  createFormHasProfileData,
  isInstructorPrivilege,
  PILOT_PRIVILEGE_OPTIONS,
} from '@/lib/logbookCreate'
import { defaultLogbookCreateForm } from '@/types/logbookCreate'
import type { Page } from '@/types'

const STEP_METHOD = 1
const STEP_SETUP = 2
const STEP_PERSONAL = 3
const STEP_LICENSE = 4
const STEP_TOTALS = 5
const STEP_MEDICAL = 6
const STEP_CLUB = 7

const router = useRouter()
const route = useRoute()
const { user, fetchMe } = useAuth()
const { connect, create, applyWizard, mutating, error } = useLogbook()
const { pickSpreadsheet } = useGooglePicker()
const { show } = useFlashMessage()

const createMode = ref<CreateLogbookMode | null>(null)
const step = ref(STEP_METHOD)
const driveScopeGranted = ref(false)
const driveScopeLoading = ref(false)
const driveScopeError = ref<string | null>(null)
const validationError = ref<string | null>(null)
const manualConfirmed = ref(false)
const manualInstruction = ref<Page | null>(null)
const manualInstructionLoading = ref(false)
const manualInstructionError = ref<string | null>(null)
const pickerBusy = ref(false)
const pickerError = ref<string | null>(null)
const prefillLoading = ref(false)
const prefillError = ref<string | null>(null)

const skippedLicense = ref(false)
const skippedTotals = ref(false)
const skippedMedical = ref(false)
const skippedClubAutomation = ref(false)
const selectedOrganizationId = ref<number | null>(null)
const organizations = ref<OrganizationListItem[]>([])
const organizationsLoading = ref(true)
const organizationsError = ref<string | null>(null)

const form = reactive(defaultLogbookCreateForm())

const stepLabels = ['Method', 'Setup', 'Personal', 'License', 'Totals', 'Medical', 'Club sync'] as const
const totalSteps = stepLabels.length

const showInstructorFields = computed(() => isInstructorPrivilege(form.pilot_privilege))
const showBiRefDate = computed(() => form.pilot_privilege === 'bi')
const showFiDates = computed(() => form.pilot_privilege === 'fi')
const isManual = computed(() => createMode.value === 'manual')
const isAutomatic = computed(() => createMode.value === 'automatic')
const logbookConnected = computed(() => Boolean(user.value?.has_logbook))

const selectedOrganization = computed(() =>
  organizations.value.find((org) => org.id === selectedOrganizationId.value) ?? null,
)

function currentWizardState() {
  return {
    createMode: createMode.value,
    step: step.value,
    form: { ...form },
    skippedLicense: skippedLicense.value,
    skippedTotals: skippedTotals.value,
    skippedMedical: skippedMedical.value,
    skippedClubAutomation: skippedClubAutomation.value,
    selectedOrganizationId: selectedOrganizationId.value,
    manualConfirmed: manualConfirmed.value,
  }
}

function restoreWizardState(): void {
  const saved = loadCreateLogbookWizardState()
  if (!saved) return
  createMode.value = saved.createMode
  step.value = saved.step
  Object.assign(form, saved.form)
  skippedLicense.value = saved.skippedLicense
  skippedTotals.value = saved.skippedTotals
  skippedMedical.value = saved.skippedMedical
  skippedClubAutomation.value = saved.skippedClubAutomation
  selectedOrganizationId.value = saved.selectedOrganizationId
  manualConfirmed.value = saved.manualConfirmed
}

function persistWizardState(pendingSubmit = false): void {
  saveCreateLogbookWizardState(currentWizardState(), pendingSubmit)
}

function redirectForDriveAccess(): void {
  persistWizardState()
  createLogbookAuthRedirect()
}

async function loadDriveScopeStatus(): Promise<void> {
  if (!isAutomatic.value) return
  driveScopeLoading.value = true
  driveScopeError.value = null
  try {
    const status = await fetchCreateLogbookScopes()
    driveScopeGranted.value = status.granted
  } catch {
    driveScopeError.value = 'Could not verify Google Drive permissions.'
    driveScopeGranted.value = false
  } finally {
    driveScopeLoading.value = false
  }
}

async function loadManualInstruction(): Promise<void> {
  manualInstructionLoading.value = true
  manualInstructionError.value = null
  try {
    manualInstruction.value = await getPage('logbook_create_manual_short')
  } catch {
    manualInstructionError.value = 'Could not load instructions.'
  } finally {
    manualInstructionLoading.value = false
  }
}

async function loadOrganizations(): Promise<void> {
  organizationsLoading.value = true
  organizationsError.value = null
  try {
    organizations.value = await listOrganizations()
  } catch {
    organizationsError.value = 'Failed to load organisations.'
  } finally {
    organizationsLoading.value = false
  }
}

async function prefillFormFromConnectedLogbook(): Promise<void> {
  if (!logbookConnected.value) return

  prefillLoading.value = true
  prefillError.value = null
  try {
    const settings = await getSettings()
    applySheetSettingsToCreateForm(form, settings)
    persistWizardState()
  } catch {
    prefillError.value = 'Could not read details from your logbook.'
  } finally {
    prefillLoading.value = false
  }
}

async function openLogbookPicker(): Promise<void> {
  if (pickerBusy.value) return
  pickerError.value = null
  pickerBusy.value = true
  try {
    const picked = await pickSpreadsheet()
    if (!picked) return
    const ok = await connect({ spreadsheet_id: picked.id })
    if (ok) {
      await fetchMe()
      await prefillFormFromConnectedLogbook()
      if (createFormHasProfileData(form)) {
        show('Logbook connected. Loaded existing details from your spreadsheet.', 'success')
      } else {
        show('Logbook connected.', 'success')
      }
      persistWizardState()
    }
  } catch (err) {
    pickerError.value = err instanceof Error ? err.message : 'Picker failed'
  } finally {
    pickerBusy.value = false
  }
}

function selectMode(mode: CreateLogbookMode): void {
  createMode.value = mode
  persistWizardState()
}

watch(createMode, (mode) => {
  if (mode === 'manual') {
    void loadManualInstruction()
  }
  if (mode === 'automatic') {
    void loadDriveScopeStatus()
  }
})

watch(step, (value) => {
  if (value === STEP_SETUP && isManual.value && !manualInstruction.value) {
    void loadManualInstruction()
  }
  if (value === STEP_SETUP && isAutomatic.value) {
    void loadDriveScopeStatus()
  }
})

onMounted(async () => {
  restoreWizardState()
  const pendingSubmit = consumeCreateLogbookPendingSubmit()
  const driveAuth = route.query.drive_auth as string | undefined

  if (driveAuth === 'success' || driveAuth === 'error' || driveAuth === 'account_mismatch') {
    await router.replace({ path: route.path })
  }

  if (isAutomatic.value) {
    await loadDriveScopeStatus()
    if (driveAuth === 'success' && driveScopeGranted.value && step.value <= STEP_SETUP) {
      step.value = STEP_PERSONAL
      persistWizardState()
    } else if (driveAuth === 'account_mismatch') {
      driveScopeError.value =
        'You signed in to Google with a different account than the one used in this app. Use the same Google account and try again.'
    } else if (driveAuth === 'error') {
      driveScopeError.value = 'Could not complete Google Drive authorisation. Please try again.'
    }
  }

  if (isManual.value) {
    void loadManualInstruction()
    if (user.value?.has_logbook && !form.pilot_name.trim()) {
      await prefillFormFromConnectedLogbook()
    }
  }

  if (pendingSubmit && step.value === STEP_CLUB) {
    await submit()
  }

  void loadOrganizations()
})

function goBack(): void {
  if (step.value > STEP_METHOD) {
    step.value -= 1
    persistWizardState()
  }
}

function skipCurrentStep(): void {
  if (step.value === STEP_LICENSE) skippedLicense.value = true
  if (step.value === STEP_TOTALS) skippedTotals.value = true
  if (step.value === STEP_MEDICAL) skippedMedical.value = true
  if (step.value === STEP_CLUB) skippedClubAutomation.value = true
  if (step.value < totalSteps) {
    step.value += 1
    persistWizardState()
    return
  }
  void submit()
}

function goNext(): void {
  validationError.value = null

  if (step.value === STEP_METHOD) {
    if (!createMode.value) {
      validationError.value = 'Choose how you want to create your logbook.'
      return
    }
    step.value = STEP_SETUP
    persistWizardState()
    return
  }

  if (step.value === STEP_SETUP) {
    if (isManual.value) {
      if (!manualConfirmed.value) {
        validationError.value = 'Confirm that you created your logbook using the instructions.'
        return
      }
      if (!logbookConnected.value) {
        validationError.value = 'Open your logbook spreadsheet with Google Drive Picker first.'
        return
      }
    }
    if (isAutomatic.value) {
      if (!driveScopeGranted.value) {
        redirectForDriveAccess()
        return
      }
    }
    step.value = STEP_PERSONAL
    persistWizardState()
    return
  }

  if (step.value === STEP_PERSONAL && !form.pilot_name.trim()) {
    validationError.value = 'Pilot name is required.'
    return
  }

  if (step.value === STEP_CLUB && !skippedClubAutomation.value && selectedOrganizationId.value == null) {
    validationError.value = 'Select an organisation or skip this step.'
    return
  }

  if (step.value < totalSteps) {
    step.value += 1
    persistWizardState()
    return
  }

  void submit()
}

async function submit(): Promise<void> {
  if (mutating.value) return

  validationError.value = null
  if (!form.pilot_name.trim()) {
    validationError.value = 'Pilot name is required.'
    step.value = STEP_PERSONAL
    return
  }

  if (isAutomatic.value && !driveScopeGranted.value) {
    await loadDriveScopeStatus()
    if (!driveScopeGranted.value) {
      redirectForDriveAccess()
      return
    }
  }

  const payload = buildLogbookCreatePayload(form, {
    skippedLicense: skippedLicense.value,
    skippedTotals: skippedTotals.value,
    skippedMedical: skippedMedical.value,
    skippedClubAutomation: skippedClubAutomation.value,
    organizationId: selectedOrganizationId.value,
  })

  const response = isManual.value ? await applyWizard(payload) : await create(payload)

  if (response) {
    clearCreateLogbookWizardState()
    await fetchMe()
    if (response.club_automation_request) {
      show(response.club_automation_request.message, 'success')
    } else {
      show(isManual.value ? 'Logbook details saved.' : 'Logbook created successfully.', 'success')
    }
    await router.push('/dashboard')
  }
}

async function retrySubmit(): Promise<void> {
  if (isAutomatic.value) {
    await loadDriveScopeStatus()
  }
  await submit()
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6 py-8">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Create your logbook</h1>
      <p class="mt-2 text-slate-600">
        Copy the template yourself or let us create it in your Google Drive, then enter your pilot details.
      </p>
    </div>

    <nav aria-label="Wizard progress" class="flex flex-wrap gap-2">
      <span
        v-for="(label, index) in stepLabels"
        :key="label"
        class="rounded-full px-3 py-1 text-sm font-medium"
        :class="
          step === index + 1
            ? 'bg-sky-100 text-sky-900 ring-1 ring-sky-200'
            : step > index + 1
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-slate-100 text-slate-500'
        "
      >
        {{ index + 1 }}. {{ label }}
      </span>
    </nav>

    <ErrorBanner v-if="error" :message="error" :retry-busy="mutating" @retry="retrySubmit" />
    <ErrorBanner v-if="validationError" :message="validationError" />
    <ErrorBanner v-if="driveScopeError" :message="driveScopeError" />
    <ErrorBanner v-if="pickerError" :message="pickerError" />
    <ErrorBanner v-if="prefillError" :message="prefillError" @retry="prefillFormFromConnectedLogbook()" />

    <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <form class="space-y-4" @submit.prevent="goNext">
        <template v-if="step === STEP_METHOD">
          <h2 class="text-lg font-semibold text-slate-900">How would you like to create your logbook?</h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="rounded-lg border p-4 text-left transition"
              :class="
                createMode === 'manual'
                  ? 'border-sky-400 bg-sky-50 ring-1 ring-sky-200'
                  : 'border-slate-200 hover:border-slate-300'
              "
              @click="selectMode('manual')"
            >
              <p class="font-semibold text-slate-900">Create manually</p>
              <p class="mt-1 text-sm text-slate-600">
                Copy the template in Google Drive yourself. Only the spreadsheet you select is shared with us.
              </p>
            </button>
            <button
              type="button"
              class="rounded-lg border p-4 text-left transition"
              :class="
                createMode === 'automatic'
                  ? 'border-sky-400 bg-sky-50 ring-1 ring-sky-200'
                  : 'border-slate-200 hover:border-slate-300'
              "
              @click="selectMode('automatic')"
            >
              <p class="font-semibold text-slate-900">Create automatically</p>
              <p class="mt-1 text-sm text-slate-600">
                We copy the template into your Drive for you. Requires one-time full Google Drive access.
              </p>
            </button>
          </div>
        </template>

        <template v-else-if="step === STEP_SETUP && isManual">
          <h2 class="text-lg font-semibold text-slate-900">Copy the template</h2>
          <LoadingState v-if="manualInstructionLoading" />
          <ErrorBanner
            v-else-if="manualInstructionError"
            :message="manualInstructionError"
            @retry="loadManualInstruction"
          />
          <MarkdownContent
            v-else-if="manualInstruction"
            class="manual-instruction"
            :source="manualInstruction.content"
          />

          <label class="mt-4 flex items-start gap-3 text-sm text-slate-700">
            <input v-model="manualConfirmed" type="checkbox" class="mt-1" />
            <span>I created my logbook using the instructions</span>
          </label>

          <div v-if="manualConfirmed" class="space-y-2">
            <ActionButton type="button" :busy="pickerBusy || prefillLoading" @click="openLogbookPicker">
              Open logbook
            </ActionButton>
            <LoadingState v-if="prefillLoading" label="Reading logbook details…" />
            <p v-else-if="logbookConnected" class="text-sm text-emerald-700">
              Logbook connected. Continue to enter your pilot details.
            </p>
          </div>
        </template>

        <template v-else-if="step === STEP_SETUP && isAutomatic">
          <h2 class="text-lg font-semibold text-slate-900">Automatic creation</h2>
          <p class="text-sm text-slate-600">
            To copy the public template into your Google Drive, we need
            <strong>one-time permission to access your Google Drive</strong>. After the logbook is created,
            daily use only needs access to your logbook file — not your entire Drive.
          </p>
          <LoadingState v-if="driveScopeLoading" />
          <p v-else-if="driveScopeGranted" class="text-sm text-emerald-700">
            Google Drive access granted. Continue to enter your pilot details.
          </p>
          <ActionButton
            v-else
            type="button"
            class="mt-2"
            @click="redirectForDriveAccess"
          >
            Continue and grant Drive access
          </ActionButton>
        </template>

        <template v-else-if="step === STEP_PERSONAL">
          <h2 class="text-lg font-semibold text-slate-900">Personal information</h2>

          <label class="block text-sm">
            <span class="font-medium text-slate-700">Pilot name <span class="text-red-600">*</span></span>
            <input v-model="form.pilot_name" type="text" class="field-control" required />
          </label>

          <label class="block text-sm">
            <span class="font-medium text-slate-700">Pilot address</span>
            <input v-model="form.pilot_address" type="text" class="field-control" />
          </label>

          <label class="block text-sm">
            <span class="font-medium text-slate-700">Pilot privilege</span>
            <select v-model="form.pilot_privilege" class="field-control">
              <option v-for="option in PILOT_PRIVILEGE_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label v-if="showInstructorFields" class="block text-sm">
            <span class="font-medium text-slate-700">Instructor from date</span>
            <input v-model="form.instructor_from_date" type="date" class="field-control" />
          </label>

          <label v-if="showBiRefDate" class="block text-sm">
            <span class="font-medium text-slate-700">BI — refresh training date</span>
            <input v-model="form.bi_ref_date" type="date" class="field-control" />
          </label>

          <template v-if="showFiDates">
            <label class="block text-sm">
              <span class="font-medium text-slate-700">FI — refresh training date</span>
              <input v-model="form.fi_3year_date" type="date" class="field-control" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">FI — demonstration flight date</span>
              <input v-model="form.fi_ref_date" type="date" class="field-control" />
            </label>
          </template>
        </template>

        <template v-else-if="step === STEP_LICENSE">
          <h2 class="text-lg font-semibold text-slate-900">License</h2>
          <p class="text-sm text-slate-600">Optional — you can skip this step.</p>

          <label class="block text-sm">
            <span class="font-medium text-slate-700">License type</span>
            <input v-model="form.license_type" type="text" class="field-control" />
          </label>

          <label class="block text-sm">
            <span class="font-medium text-slate-700">License date</span>
            <input v-model="form.license_date" type="date" class="field-control" />
          </label>

          <label class="block text-sm">
            <span class="font-medium text-slate-700">License number</span>
            <input v-model="form.license_number" type="text" class="field-control" />
          </label>

          <label class="block text-sm">
            <span class="font-medium text-slate-700">License authority</span>
            <input v-model="form.license_authority" type="text" class="field-control" />
          </label>
        </template>

        <template v-else-if="step === STEP_TOTALS">
          <h2 class="text-lg font-semibold text-slate-900">Totals from earlier logbooks</h2>
          <p class="text-sm text-slate-600">Optional prior totals — you can skip this step.</p>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block text-sm">
              <span class="font-medium text-slate-700">Total time</span>
              <input v-model="form.prior_total_time" type="text" placeholder="H:MM" class="field-control" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">PIC time</span>
              <input v-model="form.prior_pic_time" type="text" placeholder="H:MM" class="field-control" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">P2 time</span>
              <input v-model="form.prior_p2_time" type="text" placeholder="H:MM" class="field-control" />
            </label>
            <label v-if="showInstructorFields" class="block text-sm">
              <span class="font-medium text-slate-700">Instructor time</span>
              <input v-model="form.prior_instructor_time" type="text" placeholder="H:MM" class="field-control" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">Landings</span>
              <input v-model="form.prior_flight_count" type="number" min="0" class="field-control" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">Kms flown</span>
              <input v-model="form.prior_kms_flown" type="text" class="field-control" />
            </label>
          </div>
        </template>

        <template v-else-if="step === STEP_MEDICAL">
          <h2 class="text-lg font-semibold text-slate-900">Medical</h2>
          <p class="text-sm text-slate-600">Current medical certificate — optional, you can skip this step.</p>

          <label class="block text-sm">
            <span class="font-medium text-slate-700">Medical type</span>
            <input v-model="form.medical_type" type="text" class="field-control" />
          </label>

          <label class="block text-sm">
            <span class="font-medium text-slate-700">Issue date</span>
            <input v-model="form.medical_issue_date" type="date" class="field-control" />
          </label>

          <label class="block text-sm">
            <span class="font-medium text-slate-700">Expire date</span>
            <input v-model="form.medical_expire_date" type="date" class="field-control" />
          </label>
        </template>

        <template v-else-if="step === STEP_CLUB">
          <h2 class="text-lg font-semibold text-slate-900">Club automatic flight import</h2>
          <p class="text-sm text-slate-600">
            Connect automatic flight logging from your club. We will email the organisation with your
            logbook details.
          </p>

          <LoadingState v-if="organizationsLoading" />
          <ErrorBanner
            v-else-if="organizationsError"
            :message="organizationsError"
            :retry-busy="organizationsLoading"
            @retry="loadOrganizations"
          />
          <template v-else>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">Organisation</span>
              <select v-model="selectedOrganizationId" class="field-control">
                <option :value="null">Select organisation…</option>
                <option v-for="org in organizations" :key="org.id" :value="org.id">
                  {{ org.name }}
                </option>
              </select>
            </label>
            <p
              v-if="selectedOrganization"
              class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              {{ ORGANIZATION_AUTOMATION_FORM_NOTICE }}
            </p>
            <p v-if="organizations.length === 0" class="text-sm text-slate-500">
              No organisations are available yet. You can skip this step.
            </p>
          </template>
        </template>

        <div class="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
          <ActionButton
            v-if="step > STEP_METHOD"
            type="button"
            variant="secondary"
            :disabled="mutating"
            @click="goBack"
          >
            Back
          </ActionButton>

          <ActionButton
            v-if="step >= STEP_LICENSE && step <= STEP_CLUB"
            type="button"
            variant="secondary"
            :disabled="mutating"
            @click="skipCurrentStep"
          >
            {{ step === STEP_CLUB ? 'Skip and finish' : 'Skip' }}
          </ActionButton>

          <ActionButton type="submit" class="ml-auto" :busy="mutating || driveScopeLoading">
            {{
              step === STEP_CLUB
                ? isManual
                  ? 'Save logbook details'
                  : 'Create logbook'
                : 'Next'
            }}
          </ActionButton>
        </div>
      </form>
    </section>

    <p class="text-center text-sm text-slate-600">
      Already have a logbook?
      <RouterLink to="/connect" class="font-medium text-sky-700 hover:text-sky-800">Connect existing</RouterLink>
    </p>
  </div>
</template>

<style scoped>
:deep(.manual-instruction a) {
  color: rgb(3 105 161);
  font-weight: 500;
  text-decoration: underline;
}
</style>
