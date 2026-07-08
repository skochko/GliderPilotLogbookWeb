<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { isApiError } from '@/api/errors'
import { useSummary } from '@/composables/useSummary'
import type { MedicalBlock, MedicalEntry, SummaryPatch } from '@/types'

const { summary, medical, loading, error, fetchSummary, saveSummary, fetchMedical, saveMedical } =
  useSummary()

const summaryForm = reactive<SummaryPatch>({
  by_date_start: '',
  by_date_end: '',
  fi_train_date: '',
  fi_training_date_2: '',
  bi_ref_date: '',
  fi_3year_date: '',
  fi_ref_date: '',
})

const medicalEntries = ref<MedicalEntry[]>([
  { start_date: '', medical_type: '', expiry_date: '' },
  { start_date: '', medical_type: '', expiry_date: '' },
  { start_date: '', medical_type: '', expiry_date: '' },
])

const submitError = ref<string | null>(null)
const saving = ref(false)

const summaryFields: Array<{ key: keyof SummaryPatch; label: string }> = [
  { key: 'by_date_start', label: 'By date start' },
  { key: 'by_date_end', label: 'By date end' },
  { key: 'fi_train_date', label: 'FI train date' },
  { key: 'fi_training_date_2', label: 'FI training date 2' },
  { key: 'bi_ref_date', label: 'BI ref date' },
  { key: 'fi_3year_date', label: 'FI 3-year date' },
  { key: 'fi_ref_date', label: 'FI ref date' },
]

onMounted(async () => {
  await fetchSummary()
  await fetchMedical()
  if (summary.value) {
    Object.assign(summaryForm, summary.value)
  }
  if (medical.value?.entries?.length === 3) {
    medicalEntries.value = medical.value.entries.map((e) => ({ ...e }))
  }
})

async function saveAll(): Promise<void> {
  submitError.value = null
  saving.value = true
  try {
    await saveSummary({ ...summaryForm })
    const payload: MedicalBlock = { entries: medicalEntries.value }
    await saveMedical(payload)
  } catch (err) {
    submitError.value = isApiError(err) ? err.message : 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Summary</h1>
      <p class="mt-1 text-slate-600">Summary Glider dates and medical records.</p>
    </div>

    <LoadingState v-if="loading && !summary" />
    <ErrorBanner v-else-if="error" :message="error" @retry="fetchSummary" />
    <ErrorBanner v-if="submitError" :message="submitError" />

    <form v-if="summary" class="space-y-8" @submit.prevent="saveAll">
      <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="font-semibold text-slate-900">Summary dates</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <label v-for="field in summaryFields" :key="field.key" class="block text-sm">
            <span class="font-medium text-slate-700">{{ field.label }}</span>
            <input
              v-model="summaryForm[field.key]"
              type="date"
              class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="font-semibold text-slate-900">Medical records</h2>
        <p class="mt-1 text-sm text-slate-600">Exactly 3 entries required.</p>
        <div class="mt-4 space-y-4">
          <div
            v-for="(entry, index) in medicalEntries"
            :key="index"
            class="grid gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:grid-cols-3"
          >
            <label class="block text-sm">
              <span class="font-medium text-slate-700">Start date</span>
              <input
                v-model="entry.start_date"
                type="date"
                class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">Medical type</span>
              <input
                v-model="entry.medical_type"
                type="text"
                class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label class="block text-sm">
              <span class="font-medium text-slate-700">Expiry date</span>
              <input
                v-model="entry.expiry_date"
                type="date"
                class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
        </div>
      </section>

      <button
        type="submit"
        class="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
        :disabled="saving"
      >
        {{ saving ? 'Saving…' : 'Save summary' }}
      </button>
    </form>
  </div>
</template>
