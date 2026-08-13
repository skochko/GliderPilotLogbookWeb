<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { getSettings } from '@/api/settings'
import { getSummary, updateSummary } from '@/api/summary'
import { isApiError } from '@/api/errors'
import { useFlashMessage } from '@/composables/useFlashMessage'
import type { QualificationSummary, QualificationSummaryPatch } from '@/types/summary'

const { show } = useFlashMessage()
const pilotPrivilege = ref('SPL Pilot')
const summary = reactive<QualificationSummary>(emptySummary())
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

const isSpl = computed(() => pilotPrivilege.value === 'SPL Pilot')
const isBi = computed(() => pilotPrivilege.value === 'BI')
const isFi = computed(() => pilotPrivilege.value === 'FI')
const hasQualificationDates = computed(() => isSpl.value || isBi.value || isFi.value)

function emptySummary(): QualificationSummary {
  return {
    by_date_start: '',
    by_date_end: '',
    fi_train_date: '',
    fi_training_date_2: '',
    bi_ref_date: '',
    fi_3year_date: '',
    fi_ref_date: '',
  }
}

onMounted(load)

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const [settings, dates] = await Promise.all([getSettings(), getSummary({ waitForFresh: true })])
    pilotPrivilege.value = settings.pilot_privilege ?? 'SPL Pilot'
    Object.assign(summary, dates)
  } catch (err) {
    error.value = isApiError(err) ? err.message : 'Could not load qualification dates.'
  } finally {
    loading.value = false
  }
}

function buildPatch(): QualificationSummaryPatch {
  if (isSpl.value) {
    return {
      fi_train_date: summary.fi_train_date,
      fi_training_date_2: summary.fi_training_date_2,
    }
  }
  if (isBi.value) return { bi_ref_date: summary.bi_ref_date }
  if (isFi.value) {
    return {
      fi_3year_date: summary.fi_3year_date,
      fi_ref_date: summary.fi_ref_date,
    }
  }
  return {}
}

async function save(): Promise<void> {
  if (saving.value || !hasQualificationDates.value) return
  saving.value = true
  error.value = null
  try {
    Object.assign(summary, await updateSummary(buildPatch()))
    show('Qualification dates saved.', 'success')
  } catch (err) {
    error.value = isApiError(err) ? err.message : 'Could not save qualification dates.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Training &amp; Qualification Dates</h1>
      <p class="mt-1 text-slate-600">Qualification dates stored in your legacy logbook template.</p>
    </div>

    <LoadingState v-if="loading" />
    <ErrorBanner v-else-if="error" :message="error" :retry-busy="loading" @retry="load" />

    <form
      v-else
      class="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="save"
    >
      <div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Pilot privilege: <span class="font-medium">{{ pilotPrivilege }}</span>
      </div>

      <div v-if="isSpl" class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm">
          <span class="font-medium text-slate-700">Training flight FI(S) — date 1</span>
          <input v-model="summary.fi_train_date" type="date" class="field-control mt-1" />
        </label>
        <label class="block text-sm">
          <span class="font-medium text-slate-700">Training flight FI(S) — date 2</span>
          <input v-model="summary.fi_training_date_2" type="date" class="field-control mt-1" />
        </label>
      </div>

      <label v-else-if="isBi" class="block max-w-md text-sm">
        <span class="font-medium text-slate-700">BI refresher / demonstration date</span>
        <input v-model="summary.bi_ref_date" type="date" class="field-control mt-1" />
      </label>

      <div v-else-if="isFi" class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm">
          <span class="font-medium text-slate-700">FI refresher training date</span>
          <input v-model="summary.fi_3year_date" type="date" class="field-control mt-1" />
        </label>
        <label class="block text-sm">
          <span class="font-medium text-slate-700">FI demonstration date</span>
          <input v-model="summary.fi_ref_date" type="date" class="field-control mt-1" />
        </label>
      </div>

      <p v-else class="text-sm text-slate-600">
        No legacy qualification dates are required for this pilot privilege.
      </p>

      <ActionButton v-if="hasQualificationDates" type="submit" :busy="saving">
        Save qualification dates
      </ActionButton>
    </form>
  </div>
</template>
