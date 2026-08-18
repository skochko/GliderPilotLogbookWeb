<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import AirfieldAutocomplete from '@/components/AirfieldAutocomplete.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced by the Vue template
import LoadingState from '@/components/LoadingState.vue'
import {
  getQualificationEvents,
  updateQualificationEvents,
} from '@/api/qualificationEvents'
import { getSettings } from '@/api/settings'
import { getSummary, updateSummary } from '@/api/summary'
import { listOrganizations, type OrganizationListItem } from '@/api/organizations'
import { useAuth } from '@/composables/useAuth'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useLogbook } from '@/composables/useLogbook'
import {
  clearCreateLogbookWizardState,
  consumeCreateLogbookPendingSubmit,
  loadCreateLogbookWizardState,
  saveCreateLogbookWizardState,
} from '@/lib/createLogbookWizardStorage'
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced by the Vue template
import { ORGANIZATION_AUTOMATION_FORM_NOTICE } from '@/lib/organizations'
import {
  applySheetSettingsToCreateForm,
  buildLogbookCreatePayload,
} from '@/lib/logbookCreate'
import { isBiPrivilege, isFiPrivilege, usePilotPrivileges } from '@/composables/usePilotPrivileges'
import { useLicenseOptions, withLegacyLookupOption } from '@/composables/useLicenseOptions'
import { defaultLogbookCreateForm } from '@/types/logbookCreate'
import type { QualificationSummary } from '@/types/summary'
import {
  QUALIFICATION_EVENT_TYPES,
  type QualificationEvent,
} from '@/types/qualificationEvents'

const STEP_PERSONAL = 1
const STEP_LICENSE = 2
const STEP_TOTALS = 3
const STEP_MEDICAL = 4
const STEP_QUALIFICATIONS = 5

const router = useRouter()
const route = useRoute()
const { user, fetchMe } = useAuth()
const { applyWizard, mutating, error } = useLogbook()
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

const step = ref(STEP_PERSONAL)
const stepsNavRef = ref<HTMLElement | null>(null)
const validationError = ref<string | null>(null)
const prefillLoading = ref(false)
const prefillError = ref<string | null>(null)
const setupDataLoaded = ref(false)
const savingQualificationEvents = ref(false)

const skippedLicense = ref(false)
const skippedTotals = ref(false)
const skippedMedical = ref(false)
const skippedClubAutomation = ref(false)
const selectedOrganizationId = ref<number | null>(null)
const clubAutomationConsent = ref(false)
const automationImportMode = ref<'all' | 'from_date'>('all')
const automationImportFromDate = ref('')
const organizations = ref<OrganizationListItem[]>([])
const organizationsLoading = ref(true)
const organizationsError = ref<string | null>(null)

const form = reactive(defaultLogbookCreateForm())
const templateVersion = ref('')
const qualificationEvents = ref<QualificationEvent[]>([])
const legacySummary = reactive<QualificationSummary>({
  by_date_start: '',
  by_date_end: '',
  fi_train_date: '',
  fi_training_date_2: '',
  bi_ref_date: '',
  fi_3year_date: '',
  fi_ref_date: '',
})
const postCreateSetup = computed(() => route.name === 'logbook-setup')
const isV3Template = computed(() => templateVersion.value.startsWith('3.'))

const stepLabels = [
  'Personal ✓',
  'License',
  'Totals',
  'Medical / PMD',
  'Training & qualification events',
] as const
const totalSteps = stepLabels.length

const showInstructorFields = computed(() => isInstructorPrivilege(form.pilot_privilege))
const showBiRefDate = computed(
  () => !isV3Template.value && isBiPrivilege(form.pilot_privilege),
)
const showFiDates = computed(
  () => !isV3Template.value && isFiPrivilege(form.pilot_privilege),
)
const showLegacyQualificationDates = computed(() => !isV3Template.value)
const licenseTypeOptions = computed(() => withLegacyLookupOption(licenseTypes.value, form.license_type))
const licenseAuthorityOptions = computed(() =>
  withLegacyLookupOption(licenseAuthorities.value, form.license_authority),
)
const logbookConnected = computed(() => Boolean(user.value?.has_logbook))
const setupDataLoading = computed(
  () => postCreateSetup.value && (!setupDataLoaded.value || prefillLoading.value),
)
const nextDisabled = computed(
  () => setupDataLoading.value || mutating.value || savingQualificationEvents.value,
)
const nextBusy = computed(
  () =>
    mutating.value || savingQualificationEvents.value || prefillLoading.value,
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced by the Vue template
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
    automationImportMode: automationImportMode.value,
    automationImportFromDate: automationImportFromDate.value,
  }
}

function restoreWizardState(): void {
  const saved = loadCreateLogbookWizardState()
  if (!saved) return
  step.value = Math.min(Math.max(saved.step, STEP_PERSONAL), STEP_QUALIFICATIONS)
  if (step.value > STEP_QUALIFICATIONS) {
    step.value = STEP_QUALIFICATIONS
  }
  Object.assign(form, saved.form)
  skippedLicense.value = saved.skippedLicense
  skippedTotals.value = saved.skippedTotals
  skippedMedical.value = saved.skippedMedical
  skippedClubAutomation.value = saved.skippedClubAutomation
  selectedOrganizationId.value = saved.selectedOrganizationId
  automationImportMode.value = saved.automationImportMode ?? 'all'
  automationImportFromDate.value = saved.automationImportFromDate ?? ''
}

function persistWizardState(pendingSubmit = false): void {
  saveCreateLogbookWizardState(currentWizardState(), pendingSubmit)
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
    templateVersion.value = settings.template_version ?? ''
    applySheetSettingsToCreateForm(form, settings)
    persistWizardState()
  } catch {
    prefillError.value = 'Could not read details from your logbook.'
  } finally {
    prefillLoading.value = false
  }
}

async function loadQualificationEvents(): Promise<void> {
  try {
    qualificationEvents.value = (await getQualificationEvents()).events
  } catch {
    // The qualification step can still be opened and completed manually.
  }
}

async function loadLegacySummary(): Promise<void> {
  try {
    Object.assign(legacySummary, await getSummary())
  } catch {
    validationError.value = 'Could not load qualification dates.'
  }
}

async function saveQualificationEvents(): Promise<boolean> {
  savingQualificationEvents.value = true
  try {
    if (!isV3Template.value) {
      Object.assign(legacySummary, await updateSummary(legacySummary))
      return true
    }
    const compatibleEvents = qualificationEvents.value.map((event) => ({
      ...event,
      date: event.date_completed,
    }))
    qualificationEvents.value = (await updateQualificationEvents(compatibleEvents)).events
    return true
  } catch (err) {
    validationError.value = err instanceof Error
      ? err.message
      : isV3Template.value
        ? 'Could not save qualification events.'
        : 'Could not save qualification dates.'
    return false
  } finally {
    savingQualificationEvents.value = false
  }
}

function addQualificationEvent(): void {
  qualificationEvents.value.push({
    date: '',
    place: '',
    event_type: QUALIFICATION_EVENT_TYPES[0],
    date_completed: '',
    remarks: '',
  })
}

function removeQualificationEvent(index: number): void {
  qualificationEvents.value.splice(index, 1)
}

watch(step, () => {
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
  if (postCreateSetup.value) {
    step.value = STEP_PERSONAL
  }
  await Promise.all([loadPilotPrivileges(), loadLicenseOptions()])
  const pendingSubmit = consumeCreateLogbookPendingSubmit()

  if (postCreateSetup.value || (user.value?.has_logbook && !form.pilot_name.trim())) {
    await prefillFormFromConnectedLogbook()
  }
  if (isV3Template.value) {
    await loadQualificationEvents()
  } else {
    await loadLegacySummary()
  }
  setupDataLoaded.value = true

  if (pendingSubmit) {
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
    !form.prior_pic_flight_count.trim() &&
    !form.prior_p2_time.trim() &&
    !form.prior_p2_flight_count.trim() &&
    !form.prior_instructor_time.trim() &&
    !form.prior_instructor_flight_count.trim() &&
    !flightCount &&
    !form.prior_kms_flown.trim()
  )
}

function isMedicalStepEmpty(): boolean {
  return !form.medical_type.trim() && !form.medical_issue_date && !form.medical_expire_date
}

function goBack(): void {
  if (step.value > STEP_PERSONAL) {
    step.value -= 1
    persistWizardState()
  }
}

async function goNext(): Promise<void> {
  if (mutating.value || savingQualificationEvents.value || setupDataLoading.value) return
  validationError.value = null

  if (step.value === STEP_PERSONAL && !form.pilot_name.trim()) {
    validationError.value = 'Pilot name is required.'
    return
  }
  if (step.value === STEP_PERSONAL && !form.pilot_privilege.trim()) {
    validationError.value = 'Pilot privilege is required.'
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
  if (step.value === STEP_QUALIFICATIONS && !(await saveQualificationEvents())) {
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

  const payload = buildLogbookCreatePayload(form, {
    skippedLicense: skippedLicense.value,
    skippedTotals: skippedTotals.value,
    skippedMedical: skippedMedical.value,
    skippedClubAutomation: skippedClubAutomation.value,
    organizationId: selectedOrganizationId.value,
    automationConsent: clubAutomationConsent.value,
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
      <h1 class="text-2xl font-bold text-slate-900">
        {{ postCreateSetup ? 'Complete your logbook setup' : 'Create your logbook' }}
      </h1>
      <p class="mt-2 text-slate-600">
        {{
          postCreateSetup
            ? 'Your logbook has been created. Complete the remaining details to use all features.'
            : 'Copy the official template in Google Drive, connect it here, then enter your pilot details.'
        }}
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
    <ErrorBanner v-if="prefillError" :message="prefillError" @retry="prefillFormFromConnectedLogbook()" />
    <section
      v-if="setupDataLoading"
      class="rounded-lg border border-sky-200 bg-white p-8 text-center shadow-sm"
      role="status"
      aria-live="polite"
    >
      <LoadingState />
      <p class="mt-3 text-sm font-medium text-sky-900">Loading your current logbook data…</p>
      <p class="mt-1 text-xs text-slate-500">
        The setup fields will be available when your saved information is ready.
      </p>
    </section>

    <section v-else class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <form class="space-y-4" @submit.prevent="goNext">
        <fieldset class="space-y-5">
        <template v-if="step === STEP_PERSONAL">
          <h2 class="text-lg font-semibold text-slate-900">Personal information</h2>

          <label class="block space-y-1 text-sm">
            <span class="block font-medium text-slate-700">Pilot name <span class="text-red-600">*</span></span>
            <input v-model="form.pilot_name" type="text" class="field-control" required />
          </label>

          <label class="block space-y-1 text-sm">
            <span class="block font-medium text-slate-700">Pilot address</span>
            <input v-model="form.pilot_address" type="text" class="field-control" />
          </label>

          <label class="block space-y-1 text-sm">
            <span class="block font-medium text-slate-700">
              Pilot privilege <span class="text-red-600">*</span>
            </span>
            <select
              v-model="form.pilot_privilege"
              class="field-control"
              :disabled="pilotPrivilegesLoading"
              required
            >
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
              <span class="font-medium text-slate-700">PIC flights</span>
              <input v-model="form.prior_pic_flight_count" type="number" min="0" class="field-control" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">P2 time</span>
              <input v-model="form.prior_p2_time" type="text" placeholder="H:MM" class="field-control" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">P2 flights</span>
              <input v-model="form.prior_p2_flight_count" type="number" min="0" class="field-control" />
            </label>
            <label v-if="showInstructorFields" class="block text-sm">
              <span class="font-medium text-slate-700">Instructor time</span>
              <input v-model="form.prior_instructor_time" type="text" placeholder="H:MM" class="field-control" />
            </label>
            <label v-if="showInstructorFields" class="block text-sm">
              <span class="font-medium text-slate-700">Instructor flights</span>
              <input v-model="form.prior_instructor_flight_count" type="number" min="0" class="field-control" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">Total flights</span>
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

          <label v-if="!isV3Template" class="block text-sm">
            <span class="font-medium text-slate-700">Issue date</span>
            <input v-model="form.medical_issue_date" type="date" class="field-control" />
          </label>

          <label class="block text-sm">
            <span class="font-medium text-slate-700">Expire date</span>
            <input v-model="form.medical_expire_date" type="date" class="field-control" />
          </label>
        </template>

        <template v-else-if="step === STEP_QUALIFICATIONS">
          <h2 class="text-lg font-semibold text-slate-900">
            {{ showLegacyQualificationDates ? 'Training & qualification dates' : 'Training & qualification events' }}
          </h2>
          <p v-if="showLegacyQualificationDates" class="text-sm text-slate-600">
            Enter the qualification dates recorded in your legacy logbook.
          </p>
          <p v-else class="text-sm text-slate-600">
            Add your previous training and qualification events. You can add or remove events at
            any time.
          </p>
          <div v-if="showLegacyQualificationDates" class="space-y-5">
            <label v-if="form.pilot_privilege === 'SPL Pilot'" class="block space-y-1 text-sm">
              <span class="font-medium text-slate-700">Training flight FI(S) — date 1</span>
              <input v-model="legacySummary.fi_train_date" type="date" class="field-control" />
            </label>
            <label v-if="form.pilot_privilege === 'SPL Pilot'" class="block space-y-1 text-sm">
              <span class="font-medium text-slate-700">Training flight FI(S) — date 2</span>
              <input v-model="legacySummary.fi_training_date_2" type="date" class="field-control" />
            </label>
            <label v-if="form.pilot_privilege === 'BI'" class="block space-y-1 text-sm">
              <span class="font-medium text-slate-700">BI refresher / demonstration date</span>
              <input v-model="legacySummary.bi_ref_date" type="date" class="field-control" />
            </label>
            <label v-if="form.pilot_privilege === 'FI'" class="block space-y-1 text-sm">
              <span class="font-medium text-slate-700">FI refresher training date</span>
              <input v-model="legacySummary.fi_3year_date" type="date" class="field-control" />
            </label>
            <label v-if="form.pilot_privilege === 'FI'" class="block space-y-1 text-sm">
              <span class="font-medium text-slate-700">FI demonstration date</span>
              <input v-model="legacySummary.fi_ref_date" type="date" class="field-control" />
            </label>
            <p
              v-if="form.pilot_privilege === 'Student Pilot'"
              class="text-sm text-slate-600"
            >
              No qualification dates are required for Student Pilot.
            </p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="(event, index) in qualificationEvents"
              :key="event.id ?? `new-${index}`"
              class="space-y-3 rounded-lg border border-slate-200 p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <h3 class="font-medium text-slate-800">Event {{ index + 1 }}</h3>
                <button
                  type="button"
                  class="text-sm font-medium text-red-700 hover:text-red-900"
                  @click="removeQualificationEvent(index)"
                >
                  Delete
                </button>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="block text-sm">
                  <span class="font-medium text-slate-700">Event type</span>
                  <select v-model="event.event_type" class="field-control">
                    <option v-for="type in QUALIFICATION_EVENT_TYPES" :key="type" :value="type">
                      {{ type }}
                    </option>
                  </select>
                </label>
                <label class="block text-sm">
                  <span class="font-medium text-slate-700">Date completed</span>
                  <input v-model="event.date_completed" type="date" class="field-control" />
                </label>
                <label class="block text-sm">
                  <span class="font-medium text-slate-700">Place</span>
                  <AirfieldAutocomplete
                    v-model="event.place"
                    :list-id="`qualification-event-place-options-${index}`"
                  />
                </label>
              </div>
              <label class="block text-sm">
                <span class="font-medium text-slate-700">Notes</span>
                <textarea v-model="event.remarks" rows="2" class="field-control" />
              </label>
            </div>
            <button
              type="button"
              class="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              @click="addQualificationEvent"
            >
              Add event
            </button>
          </div>
        </template>

        <!-- Club automation is configured during logbook creation, not in setup. -->
        <!--
        <template v-else-if="false">
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
            <label v-if="selectedOrganization" class="mt-4 block text-sm">
              <span class="font-medium text-slate-700">My flights to import</span>
              <span class="mt-2 flex gap-1.5 overflow-x-auto" role="radiogroup" aria-label="Import flights">
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
              v-if="selectedOrganization && automationImportMode === 'from_date'"
              class="mt-3 block text-sm"
            >
              <span class="font-medium text-slate-700">Import flights from</span>
              <input v-model="automationImportFromDate" type="date" class="field-control" required />
            </label>
            <label v-if="selectedOrganization" class="mt-4 flex items-start gap-3 text-sm text-slate-700">
              <input v-model="clubAutomationConsent" type="checkbox" class="mt-1" />
              <span>
                I agree that {{ selectedOrganization.name }} may receive access to my logbook
                to add flight records.
              </span>
            </label>
            <p v-if="organizations.length === 0" class="text-sm text-slate-500">
              No organisations are available yet. Press Next to finish without club sync.
            </p>
          </template>
        </template>
        -->

        <div class="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
          <ActionButton
            v-if="step > STEP_PERSONAL"
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
            {{ step === STEP_QUALIFICATIONS ? 'Save logbook details' : 'Next' }}
          </ActionButton>
        </div>
        </fieldset>
      </form>
    </section>
  </div>
</template>

<style scoped>
.wizard-steps-nav {
  padding-bottom: 0.75rem;
  scrollbar-width: thin;
}

</style>
