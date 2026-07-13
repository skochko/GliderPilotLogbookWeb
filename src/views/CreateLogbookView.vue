<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { listOrganizations, type OrganizationListItem } from '@/api/organizations'
import { useAuth } from '@/composables/useAuth'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useLogbook } from '@/composables/useLogbook'
import { ORGANIZATION_AUTOMATION_FORM_NOTICE } from '@/lib/organizations'
import {
  buildLogbookCreatePayload,
  isInstructorPrivilege,
  PILOT_PRIVILEGE_OPTIONS,
} from '@/lib/logbookCreate'
import { defaultLogbookCreateForm } from '@/types/logbookCreate'

const router = useRouter()
const { fetchMe } = useAuth()
const { create, mutating, error } = useLogbook()
const { show } = useFlashMessage()

const step = ref(1)
const validationError = ref<string | null>(null)
const skippedLicense = ref(false)
const skippedTotals = ref(false)
const skippedMedical = ref(false)
const skippedClubAutomation = ref(false)
const selectedOrganizationId = ref<number | null>(null)
const organizations = ref<OrganizationListItem[]>([])
const organizationsLoading = ref(true)
const organizationsError = ref<string | null>(null)

const form = reactive(defaultLogbookCreateForm())

const stepLabels = ['Personal', 'License', 'Totals', 'Medical', 'Club sync'] as const
const totalSteps = stepLabels.length

const showInstructorFields = computed(() => isInstructorPrivilege(form.pilot_privilege))
const showBiRefDate = computed(() => form.pilot_privilege === 'bi')
const showFiDates = computed(() => form.pilot_privilege === 'fi')

const selectedOrganization = computed(() =>
  organizations.value.find((org) => org.id === selectedOrganizationId.value) ?? null,
)

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

onMounted(() => {
  void loadOrganizations()
})

function goBack(): void {
  if (step.value > 1) {
    step.value -= 1
  }
}

function skipCurrentStep(): void {
  if (step.value === 2) skippedLicense.value = true
  if (step.value === 3) skippedTotals.value = true
  if (step.value === 4) skippedMedical.value = true
  if (step.value === 5) skippedClubAutomation.value = true
  if (step.value < totalSteps) {
    step.value += 1
    return
  }
  void submit()
}

function goNext(): void {
  validationError.value = null
  if (step.value === 1 && !form.pilot_name.trim()) {
    validationError.value = 'Pilot name is required.'
    return
  }
  if (step.value === 5 && !skippedClubAutomation.value && selectedOrganizationId.value == null) {
    validationError.value = 'Select an organisation or skip this step.'
    return
  }
  if (step.value < totalSteps) {
    step.value += 1
    return
  }
  void submit()
}

async function submit(): Promise<void> {
  if (mutating.value) return

  validationError.value = null
  if (!form.pilot_name.trim()) {
    validationError.value = 'Pilot name is required.'
    step.value = 1
    return
  }

  const payload = buildLogbookCreatePayload(form, {
    skippedLicense: skippedLicense.value,
    skippedTotals: skippedTotals.value,
    skippedMedical: skippedMedical.value,
    skippedClubAutomation: skippedClubAutomation.value,
    organizationId: selectedOrganizationId.value,
  })

  const response = await create(payload)
  if (response) {
    await fetchMe()
    if (response.club_automation_request) {
      show(response.club_automation_request.message, 'success')
    } else {
      show('Logbook created successfully.', 'success')
    }
    await router.push('/dashboard')
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6 py-8">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Create your logbook</h1>
      <p class="mt-2 text-slate-600">
        We copy the public template to your Google Drive folder and fill in your details.
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

    <ErrorBanner v-if="error" :message="error" />
    <ErrorBanner v-if="validationError" :message="validationError" />

    <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <form class="space-y-4" @submit.prevent="goNext">
        <template v-if="step === 1">
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

        <template v-else-if="step === 2">
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

        <template v-else-if="step === 3">
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

        <template v-else-if="step === 4">
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

        <template v-else>
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
            v-if="step > 1"
            type="button"
            variant="secondary"
            :disabled="mutating"
            @click="goBack"
          >
            Back
          </ActionButton>

          <ActionButton
            v-if="step >= 2"
            type="button"
            variant="secondary"
            :disabled="mutating"
            @click="skipCurrentStep"
          >
            {{ step === totalSteps ? 'Skip and finish' : 'Skip' }}
          </ActionButton>

          <ActionButton type="submit" class="ml-auto" :busy="mutating">
            {{ step === totalSteps ? 'Create logbook' : 'Next' }}
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
