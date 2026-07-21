<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import MarkdownContent from '@/components/MarkdownContent.vue'
import { getSettings } from '@/api/settings'
import { getPage } from '@/api/pages'
import { listOrganizations, type OrganizationListItem } from '@/api/organizations'
import { useAuth } from '@/composables/useAuth'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useGooglePicker } from '@/composables/useGooglePicker'
import { useLogbook } from '@/composables/useLogbook'
import {
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
} from '@/lib/logbookCreate'
import { isBiPrivilege, isFiPrivilege, usePilotPrivileges } from '@/composables/usePilotPrivileges'
import { useLicenseOptions, withLegacyLookupOption } from '@/composables/useLicenseOptions'
import { defaultLogbookCreateForm } from '@/types/logbookCreate'
import type { Page } from '@/types'

const STEP_SETUP = 1
const STEP_PERSONAL = 2
const STEP_LICENSE = 3
const STEP_TOTALS = 4
const STEP_MEDICAL = 5
const STEP_CLUB = 6

const router = useRouter()
const { user, fetchMe } = useAuth()
const { connect, applyWizard, mutating, error } = useLogbook()
const { pickSpreadsheet } = useGooglePicker()
const { show } = useFlashMessage()
const {
  options: pilotPrivilegeOptions,
  loading: pilotPrivilegesLoading,
  error: pilotPrivilegesError,
  load: loadPilotPrivileges,
  isInstructorPrivilege,
} = usePilotPrivileges()
const {
  licenseTypes,
  licenseAuthorities,
  loading: licenseOptionsLoading,
  error: licenseOptionsError,
  load: loadLicenseOptions,
} = useLicenseOptions()

const step = ref(STEP_SETUP)
const stepsNavRef = ref<HTMLElement | null>(null)
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

const stepLabels = ['Setup', 'Personal', 'License', 'Totals', 'Medical', 'Club sync'] as const
const totalSteps = stepLabels.length

const showInstructorFields = computed(() => isInstructorPrivilege(form.pilot_privilege))
const showBiRefDate = computed(() => isBiPrivilege(form.pilot_privilege))
const showFiDates = computed(() => isFiPrivilege(form.pilot_privilege))
const licenseTypeOptions = computed(() => withLegacyLookupOption(licenseTypes.value, form.license_type))
const licenseAuthorityOptions = computed(() =>
  withLegacyLookupOption(licenseAuthorities.value, form.license_authority),
)
const logbookConnected = computed(() => Boolean(user.value?.has_logbook))
const nextDisabled = computed(() => step.value === STEP_SETUP && !manualConfirmed.value)
const nextBusy = computed(
  () =>
    mutating.value ||
    (step.value === STEP_SETUP && (pickerBusy.value || prefillLoading.value)),
)

const selectedOrganization = computed(() =>
  organizations.value.find((org) => org.id === selectedOrganizationId.value) ?? null,
)

function currentWizardState() {
  return {
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

async function openLogbookPicker(): Promise<boolean> {
  if (pickerBusy.value) return false
  pickerError.value = null
  pickerBusy.value = true
  try {
    const picked = await pickSpreadsheet()
    if (!picked) return false
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
      return true
    }
    return false
  } catch (err) {
    pickerError.value = err instanceof Error ? err.message : 'Picker failed'
    return false
  } finally {
    pickerBusy.value = false
  }
}

watch(step, (value) => {
  if (value === STEP_SETUP && !manualInstruction.value) {
    void loadManualInstruction()
  }
  void nextTick(scrollActiveStepIntoView)
}, { flush: 'post' })

function scrollActiveStepIntoView(): void {
  const nav = stepsNavRef.value
  if (!nav) return
  const active = nav.querySelector<HTMLElement>(`[data-step="${step.value}"]`)
  active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
}

onMounted(async () => {
  restoreWizardState()
  await Promise.all([loadPilotPrivileges(), loadLicenseOptions()])
  const pendingSubmit = consumeCreateLogbookPendingSubmit()

  void loadManualInstruction()
  if (user.value?.has_logbook && !form.pilot_name.trim()) {
    await prefillFormFromConnectedLogbook()
  }

  if (pendingSubmit && step.value === STEP_CLUB) {
    await submit()
  }

  void loadOrganizations()
  void nextTick(scrollActiveStepIntoView)
})

function isLicenseStepEmpty(): boolean {
  return (
    !form.license_type.trim() &&
    !form.license_date &&
    !form.license_number.trim() &&
    !form.license_authority.trim()
  )
}

function isTotalsStepEmpty(): boolean {
  const flightCount = String(form.prior_flight_count ?? '').trim()
  return (
    !form.prior_total_time.trim() &&
    !form.prior_pic_time.trim() &&
    !form.prior_p2_time.trim() &&
    !form.prior_instructor_time.trim() &&
    !flightCount &&
    !form.prior_kms_flown.trim()
  )
}

function isMedicalStepEmpty(): boolean {
  return !form.medical_type.trim() && !form.medical_issue_date && !form.medical_expire_date
}

function goBack(): void {
  if (step.value > STEP_SETUP) {
    step.value -= 1
    persistWizardState()
  }
}

async function goNext(): Promise<void> {
  validationError.value = null

  if (step.value === STEP_SETUP) {
    if (!manualConfirmed.value) {
      validationError.value = 'Confirm that you created your logbook using the instructions.'
      return
    }
    if (!logbookConnected.value) {
      const connected = await openLogbookPicker()
      if (!connected) return
    }
    step.value = STEP_PERSONAL
    persistWizardState()
    return
  }

  if (step.value === STEP_PERSONAL && !form.pilot_name.trim()) {
    validationError.value = 'Pilot name is required.'
    return
  }

  if (step.value === STEP_LICENSE && isLicenseStepEmpty()) {
    skippedLicense.value = true
  }
  if (step.value === STEP_TOTALS && isTotalsStepEmpty()) {
    skippedTotals.value = true
  }
  if (step.value === STEP_MEDICAL && isMedicalStepEmpty()) {
    skippedMedical.value = true
  }
  if (step.value === STEP_CLUB && selectedOrganizationId.value == null) {
    skippedClubAutomation.value = true
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

  const payload = buildLogbookCreatePayload(form, {
    skippedLicense: skippedLicense.value,
    skippedTotals: skippedTotals.value,
    skippedMedical: skippedMedical.value,
    skippedClubAutomation: skippedClubAutomation.value,
    organizationId: selectedOrganizationId.value,
  })

  const response = await applyWizard(payload)

  if (response) {
    clearCreateLogbookWizardState()
    await fetchMe()
    if (response.club_automation_request) {
      show(response.club_automation_request.message, 'success')
    } else {
      show('Logbook details saved.', 'success')
    }
    await router.push('/dashboard')
  }
}

async function retrySubmit(): Promise<void> {
  await submit()
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6 py-8">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Create your logbook</h1>
      <p class="mt-2 text-slate-600">
        Copy the official template in Google Drive, connect it here, then enter your pilot details.
      </p>
    </div>

    <nav
      ref="stepsNavRef"
      aria-label="Wizard progress"
      class="wizard-steps-nav -mx-4 flex flex-nowrap gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <span
        v-for="(label, index) in stepLabels"
        :key="label"
        :data-step="index + 1"
        class="shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium"
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
    <ErrorBanner
      v-if="pilotPrivilegesError"
      :message="pilotPrivilegesError"
      :retry-busy="pilotPrivilegesLoading"
      @retry="loadPilotPrivileges"
    />
    <ErrorBanner
      v-if="licenseOptionsError"
      :message="licenseOptionsError"
      :retry-busy="licenseOptionsLoading"
      @retry="loadLicenseOptions"
    />
    <ErrorBanner v-if="pickerError" :message="pickerError" />
    <ErrorBanner v-if="prefillError" :message="prefillError" @retry="prefillFormFromConnectedLogbook()" />

    <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <form class="space-y-4" @submit.prevent="goNext">
        <template v-if="step === STEP_SETUP">
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
          <p v-if="manualConfirmed && logbookConnected" class="text-sm text-emerald-700">
            Logbook connected. Press Next to continue.
          </p>
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
            <select v-model="form.pilot_privilege" class="field-control" :disabled="pilotPrivilegesLoading">
              <option v-for="option in pilotPrivilegeOptions" :key="option.code" :value="option.code">
                {{ option.name }}
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
          <p class="text-sm text-slate-600">Optional — leave blank and press Next to continue.</p>

          <label class="block text-sm">
            <span class="font-medium text-slate-700">License type</span>
            <select v-model="form.license_type" class="field-control" :disabled="licenseOptionsLoading">
              <option value="">—</option>
              <option v-for="option in licenseTypeOptions" :key="option.code" :value="option.code">
                {{ option.name }}
              </option>
            </select>
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
            <select v-model="form.license_authority" class="field-control" :disabled="licenseOptionsLoading">
              <option value="">—</option>
              <option v-for="option in licenseAuthorityOptions" :key="option.code" :value="option.code">
                {{ option.name }}
              </option>
            </select>
          </label>
        </template>

        <template v-else-if="step === STEP_TOTALS">
          <h2 class="text-lg font-semibold text-slate-900">Totals from earlier logbooks</h2>
          <p class="text-sm text-slate-600">Optional prior totals — leave blank and press Next to continue.</p>

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
          <p class="text-sm text-slate-600">
            Current medical certificate — optional. Leave blank and press Next to continue.
          </p>

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
              No organisations are available yet. Press Next to finish without club sync.
            </p>
          </template>
        </template>

        <div class="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
          <ActionButton
            v-if="step > STEP_SETUP"
            type="button"
            variant="secondary"
            :disabled="mutating"
            @click="goBack"
          >
            Back
          </ActionButton>

          <ActionButton
            type="submit"
            class="ml-auto"
            :busy="nextBusy"
            :disabled="nextDisabled"
          >
            {{ step === STEP_CLUB ? 'Save logbook details' : 'Next' }}
          </ActionButton>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.wizard-steps-nav {
  padding-bottom: 0.75rem;
  scrollbar-width: thin;
}

:deep(.manual-instruction a) {
  color: rgb(3 105 161);
  font-weight: 500;
  text-decoration: underline;
}
</style>
