<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import PwaInstallSection from '@/components/PwaInstallSection.vue'
import { isApiError } from '@/api/errors'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useSettings } from '@/composables/useSettings'
import {
  applySheetSettingsToLogbookProfileForm,
  buildSettingsPatch,
  emptyLogbookProfileForm,
  isInstructorPrivilege,
  PILOT_PRIVILEGE_OPTIONS,
} from '@/lib/logbookProfile'
import type { LogbookProfileFormState } from '@/lib/logbookProfile'
import type { SheetSettings } from '@/types'

const { settings, loading, initialized, mutating, error, fetch, save } = useSettings()
const { show } = useFlashMessage()

const form = reactive<LogbookProfileFormState>(emptyLogbookProfileForm())
const submitError = ref<string | null>(null)

const dateFormatOptions = computed(() => settings.value?.date_format_options ?? [])
const showInstructorFields = computed(() => isInstructorPrivilege(form.pilot_privilege))
const showBiRefDate = computed(() => form.pilot_privilege === 'bi')
const showFiDates = computed(() => form.pilot_privilege === 'fi')

function applySettingsToForm(data: SheetSettings): void {
  applySheetSettingsToLogbookProfileForm(form, data)
}

onMounted(async () => {
  await fetch()
  if (settings.value) {
    applySettingsToForm(settings.value as SheetSettings)
  }
})

async function onSubmit(): Promise<void> {
  if (mutating.value) return

  submitError.value = null
  if (!form.pilot_name.trim()) {
    submitError.value = 'Pilot name is required'
    return
  }

  try {
    const updated = await save(buildSettingsPatch(form))
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
      <h1 class="text-2xl font-bold text-slate-900">Settings</h1>
      <p class="mt-1 text-slate-600">Edit your logbook profile and sheet preferences.</p>
    </div>

    <LoadingState v-if="!initialized" />
    <ErrorBanner v-else-if="error" :message="error" :retry-busy="loading" @retry="fetch" />
    <ErrorBanner v-if="submitError" :message="submitError" />

    <PwaInstallSection />

    <form
      v-if="settings"
      class="space-y-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="onSubmit"
    >
      <section class="space-y-4">
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
          <label class="block text-sm sm:col-span-2">
            <span class="font-medium text-slate-700">Pilot name <span class="text-red-600">*</span></span>
            <input v-model="form.pilot_name" type="text" class="field-control" required />
          </label>

          <label class="block text-sm sm:col-span-2">
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
        </div>
      </section>

      <section class="space-y-4 border-t border-slate-200 pt-6">
        <h2 class="text-lg font-semibold text-slate-900">License</h2>
        <div class="grid gap-4 sm:grid-cols-2">
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
        </div>
      </section>

      <section class="space-y-4 border-t border-slate-200 pt-6">
        <h2 class="text-lg font-semibold text-slate-900">Prior totals</h2>
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
            <input
              v-model="form.prior_instructor_time"
              type="text"
              placeholder="H:MM"
              class="field-control"
            />
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
      </section>

      <section class="space-y-4 border-t border-slate-200 pt-6">
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

      <section class="space-y-4 border-t border-slate-200 pt-6">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Club flight import</h2>
          <p class="mt-1 text-sm text-slate-600">
            When club automation syncs flights into your logbook, only flights on or after this date are
            imported. Set a date if you do not want older club records loaded; leave empty to include all
            available history.
          </p>
        </div>
        <label class="block max-w-md text-sm">
          <span class="font-medium text-slate-700">Import flights from</span>
          <input v-model="form.start_date" type="date" class="field-control" />
        </label>
      </section>

      <ActionButton type="submit" :busy="mutating">Save settings</ActionButton>
    </form>
  </div>
</template>
