<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import PwaInstallSection from '@/components/PwaInstallSection.vue'
import { isApiError } from '@/api/errors'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useAuth } from '@/composables/useAuth'
import { useSettings } from '@/composables/useSettings'
import { useLogbook } from '@/composables/useLogbook'
import {
  applySheetSettingsToLogbookProfileForm,
  buildSettingsPatch,
  emptyLogbookProfileForm,
} from '@/lib/logbookProfile'
import type { LogbookProfileFormState } from '@/lib/logbookProfile'
import { isBiPrivilege, isFiPrivilege, usePilotPrivileges } from '@/composables/usePilotPrivileges'
import { useLicenseOptions, withLegacyLookupOption } from '@/composables/useLicenseOptions'
import type { SheetSettings, SheetSettingsPatch } from '@/types'
import { resolveSettingsTemplate, type SettingsSection } from '@/features/settings/templates'
import { isHoursMinutesDuration } from '@/lib/duration'

const { settings, loading, initialized, mutating, error, fetch, save } = useSettings()
const { user } = useAuth()
const {
  templateEngine,
  initialized: logbookInitialized,
  fetchStatus: fetchLogbookStatus,
} = useLogbook()
const { show } = useFlashMessage()
const {
  options: pilotPrivilegeOptions,
  loading: pilotPrivilegesLoading,
  error: pilotPrivilegesError,
  load: loadPilotPrivileges,
  isInstructorPrivilege,
  noticeForPrivilege,
} = usePilotPrivileges()
const {
  licenseTypes,
  licenseAuthorities,
  loading: licenseOptionsLoading,
  error: licenseOptionsError,
  load: loadLicenseOptions,
} = useLicenseOptions()

const form = reactive<LogbookProfileFormState>(emptyLogbookProfileForm())
const formInitialized = ref(false)
const submitError = ref<string | null>(null)
const isDemo = computed(() => user.value?.is_demo ?? false)

const templateAdapter = computed(() =>
  settings.value
    ? resolveSettingsTemplate(settings.value as SheetSettings, templateEngine.value)
    : null,
)
const dateFormatOptions = computed(() => settings.value?.date_format_options ?? [])
const licenseTypeOptions = computed(() =>
  withLegacyLookupOption(licenseTypes.value, form.license_type),
)
const licenseAuthorityOptions = computed(() =>
  withLegacyLookupOption(licenseAuthorities.value, form.license_authority),
)
const showInstructorFields = computed(() => isInstructorPrivilege(form.pilot_privilege))
const showBiRefDate = computed(() => isBiPrivilege(form.pilot_privilege))
const showFiDates = computed(() => isFiPrivilege(form.pilot_privilege))
const pilotPrivilegeNotice = computed(() => noticeForPrivilege(form.pilot_privilege))
const canEdit = (field: keyof SheetSettingsPatch) => templateAdapter.value?.canEdit(field) ?? false
const shows = (section: SettingsSection) => templateAdapter.value?.shows(section) ?? false

function applySettingsToForm(data: SheetSettings): void {
  applySheetSettingsToLogbookProfileForm(form, data)
  formInitialized.value = true
}

watch(
  settings,
  (data) => {
    if (data) {
      applySettingsToForm(data as SheetSettings)
    } else {
      formInitialized.value = false
    }
  },
  { immediate: true },
)

onMounted(async () => {
  await Promise.all([
    fetch(),
    logbookInitialized.value ? Promise.resolve() : fetchLogbookStatus(),
    loadPilotPrivileges(),
    loadLicenseOptions(),
  ])
})

async function onSubmit(): Promise<void> {
  if (mutating.value || isDemo.value) return

  submitError.value = null
  if (canEdit('pilot_name') && !form.pilot_name.trim()) {
    submitError.value = 'Pilot name is required'
    return
  }

  const priorTimeFields = [
    ['prior_total_time', 'Total time'],
    ['prior_pic_time', 'PIC time'],
    ['prior_p2_time', 'P2 time'],
    ['prior_instructor_time', 'Instructor time'],
  ] as const
  for (const [field, label] of priorTimeFields) {
    const value = form[field].trim()
    if (canEdit(field) && value && !isHoursMinutesDuration(value)) {
      submitError.value = `${label} must use H:MM format, for example 156:13 or 4:15.`
      return
    }
  }

  try {
    const updated = await save(buildSettingsPatch(form, canEdit))
    if (updated) {
      applySettingsToForm(updated as SheetSettings)
    }
    show('Settings saved successfully.', 'success')
  } catch (err) {
    submitError.value = isApiError(err) ? err.message : 'Failed to save settings'
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">
        {{ templateAdapter?.title ?? 'Settings' }}
      </h1>
      <p class="mt-1 text-slate-600">
        {{ templateAdapter?.description ?? 'Edit your logbook settings.' }}
      </p>
    </div>

    <LoadingState v-if="!initialized" />
    <ErrorBanner v-else-if="error" :message="error" :retry-busy="loading" @retry="fetch" />
    <ErrorBanner v-if="submitError" :message="submitError" />
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

    <PwaInstallSection />

    <form
      v-if="settings && formInitialized"
      class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="onSubmit"
    >
      <fieldset :disabled="isDemo" class="min-w-0 space-y-8 border-0 p-0">
      <section v-if="shows('displayPreferences')" class="space-y-4">
        <h2 class="text-lg font-semibold text-slate-900">Sheet behaviour</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block text-sm">
            <span class="font-medium text-slate-700">Date format</span>
            <select v-model="form.date_format" class="field-control" required>
              <option v-for="option in dateFormatOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <p
            v-if="pilotPrivilegeNotice"
            class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 sm:col-span-2"
            role="alert"
          >
            {{ pilotPrivilegeNotice }}
          </p>

          <label class="block text-sm">
            <span class="font-medium text-slate-700">Sort direction</span>
            <select v-model="form.sort_direction" class="field-control">
              <option value="newest_first">Newest first</option>
              <option value="newest_last">Newest last</option>
            </select>
          </label>
        </div>

        <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <p class="font-medium text-slate-700">Sheet colors (read-only)</p>
          <div class="mt-2 flex flex-wrap gap-4">
            <div class="flex items-center gap-2">
              <span
                class="inline-block h-6 w-6 rounded border border-slate-300"
                :style="{ backgroundColor: settings.zebra_color }"
              />
              Zebra: {{ settings.zebra_color }}
            </div>
            <div class="flex items-center gap-2">
              <span
                class="inline-block h-6 w-6 rounded border border-slate-300"
                :style="{ backgroundColor: settings.header_color }"
              />
              Header: {{ settings.header_color }}
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-4 border-t border-slate-200 pt-6">
        <h2 class="text-lg font-semibold text-slate-900">Personal</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <label v-if="canEdit('pilot_name')" class="block text-sm sm:col-span-2">
            <span class="font-medium text-slate-700"
              >Pilot name <span class="text-red-600">*</span></span
            >
            <input v-model="form.pilot_name" type="text" class="field-control" required />
          </label>

          <label v-if="canEdit('pilot_address')" class="block text-sm sm:col-span-2">
            <span class="font-medium text-slate-700">Pilot address</span>
            <input v-model="form.pilot_address" type="text" class="field-control" />
          </label>

          <label v-if="canEdit('pilot_privilege')" class="block text-sm">
            <span class="font-medium text-slate-700">Pilot privilege</span>
            <select
              v-model="form.pilot_privilege"
              class="field-control"
              :disabled="pilotPrivilegesLoading"
            >
              <option
                v-for="option in pilotPrivilegeOptions"
                :key="option.code"
                :value="option.code"
              >
                {{ option.name }}
              </option>
            </select>
          </label>

          <label
            v-if="showInstructorFields && canEdit('instructor_from_date')"
            class="block text-sm"
          >
            <span class="font-medium text-slate-700">Instructor from date</span>
            <input v-model="form.instructor_from_date" type="date" class="field-control" />
          </label>

          <label
            v-if="shows('summaryDates') && showBiRefDate && canEdit('bi_ref_date')"
            class="block text-sm"
          >
            <span class="font-medium text-slate-700">BI — refresh training date</span>
            <input v-model="form.bi_ref_date" type="date" class="field-control" />
          </label>

          <template v-if="shows('summaryDates') && showFiDates">
            <label class="block text-sm">
              <span class="font-medium text-slate-700">FI — refresh training date</span>
              <input v-model="form.fi_3year_date" type="date" class="field-control" />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">FI — demonstration flight date</span>
              <input v-model="form.fi_ref_date" type="date" class="field-control" />
            </label>
          </template>
        </div>
      </section>

      <section class="space-y-4 border-t border-slate-200 pt-6">
        <h2 class="text-lg font-semibold text-slate-900">License</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block text-sm">
            <span class="font-medium text-slate-700">License type</span>
            <select
              v-model="form.license_type"
              class="field-control"
              :disabled="licenseOptionsLoading"
            >
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
            <select
              v-model="form.license_authority"
              class="field-control"
              :disabled="licenseOptionsLoading"
            >
              <option value="">—</option>
              <option
                v-for="option in licenseAuthorityOptions"
                :key="option.code"
                :value="option.code"
              >
                {{ option.name }}
              </option>
            </select>
          </label>
        </div>
      </section>

      <section class="space-y-4 border-t border-slate-200 pt-6">
        <h2 class="text-lg font-semibold text-slate-900">Prior totals</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block text-sm">
            <span class="font-medium text-slate-700">Total time</span>
            <input
              v-model="form.prior_total_time"
              type="text"
              placeholder="H:MM"
              pattern="[0-9]+:[0-5][0-9]"
              title="Enter time as H:MM, for example 156:13"
              class="field-control"
            />
          </label>
          <label class="block text-sm">
            <span class="font-medium text-slate-700">PIC time</span>
            <input
              v-model="form.prior_pic_time"
              type="text"
              placeholder="H:MM"
              pattern="[0-9]+:[0-5][0-9]"
              title="Enter time as H:MM, for example 13:00"
              class="field-control"
            />
          </label>
          <label class="block text-sm">
            <span class="font-medium text-slate-700">PIC flights</span>
            <input
              v-model="form.prior_pic_flight_count"
              type="number"
              min="0"
              class="field-control"
            />
          </label>
          <label class="block text-sm">
            <span class="font-medium text-slate-700">P2 time</span>
            <input
              v-model="form.prior_p2_time"
              type="text"
              placeholder="H:MM"
              pattern="[0-9]+:[0-5][0-9]"
              title="Enter time as H:MM, for example 4:15"
              class="field-control"
            />
          </label>
          <label class="block text-sm">
            <span class="font-medium text-slate-700">P2 flights</span>
            <input
              v-model="form.prior_p2_flight_count"
              type="number"
              min="0"
              class="field-control"
            />
          </label>
          <label v-if="showInstructorFields" class="block text-sm">
            <span class="font-medium text-slate-700">Instructor time</span>
            <input
              v-model="form.prior_instructor_time"
              type="text"
              placeholder="H:MM"
              pattern="[0-9]+:[0-5][0-9]"
              title="Enter time as H:MM, for example 4:15"
              class="field-control"
            />
          </label>
          <label v-if="showInstructorFields" class="block text-sm">
            <span class="font-medium text-slate-700">Instructor flights</span>
            <input
              v-model="form.prior_instructor_flight_count"
              type="number"
              min="0"
              class="field-control"
            />
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
      </section>

      <section v-if="shows('medical')" class="space-y-4 border-t border-slate-200 pt-6">
        <h2 class="text-lg font-semibold text-slate-900">Current medical</h2>
        <div class="grid gap-4 sm:grid-cols-2">
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
        </div>
      </section>

      <section v-if="shows('clubImport')" class="space-y-4 border-t border-slate-200 pt-6">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Club flight import</h2>
          <p class="mt-1 text-sm text-slate-600">
            When club automation syncs flights into your logbook, only flights on or after this date
            are imported. Set a date if you do not want older club records loaded; leave empty to
            include all available history.
          </p>
        </div>
        <label class="block max-w-md text-sm">
          <span class="font-medium text-slate-700">Import flights from</span>
          <input v-model="form.start_date" type="date" class="field-control" />
        </label>
      </section>

      <ActionButton type="submit" :busy="mutating" :disabled="isDemo || mutating">
        Save settings
      </ActionButton>
      </fieldset>
    </form>
  </div>
</template>
