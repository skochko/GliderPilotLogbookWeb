<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import PwaInstallSection from '@/components/PwaInstallSection.vue'
import { isApiError } from '@/api/errors'
import { useSettings } from '@/composables/useSettings'
import type { SheetSettingsPatch } from '@/types'

const { settings, loading, initialized, mutating, error, fetch, save } = useSettings()

const form = reactive<SheetSettingsPatch>({
  date_format: '%Y-%m-%d',
  sort_direction: 'newest_first',
  pilot_name: '',
  start_date: '',
  is_instructor: false,
  instructor_from_date: '',
})

const submitError = ref<string | null>(null)

onMounted(async () => {
  await fetch()
  if (settings.value) {
    form.date_format = settings.value.date_format
    form.sort_direction = settings.value.sort_direction
    form.pilot_name = settings.value.pilot_name
    form.start_date = settings.value.start_date ?? ''
    form.is_instructor = settings.value.is_instructor
    form.instructor_from_date = settings.value.instructor_from_date ?? ''
  }
})

async function onSubmit(): Promise<void> {
  if (mutating.value) return

  submitError.value = null
  try {
    await save({
      ...form,
      start_date: form.start_date || null,
      instructor_from_date: form.instructor_from_date || null,
    })
  } catch (err) {
    submitError.value = isApiError(err) ? err.message : 'Failed to save settings'
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Settings</h1>
      <p class="mt-1 text-slate-600">Logbook preferences from your Settings sheet.</p>
    </div>

    <LoadingState v-if="!initialized" />
    <ErrorBanner v-else-if="error" :message="error" :retry-busy="loading" @retry="fetch" />
    <ErrorBanner v-if="submitError" :message="submitError" />

    <PwaInstallSection />

    <form
      v-if="settings"
      class="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="onSubmit"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm">
          <span class="font-medium text-slate-700">Date format</span>
          <select v-model="form.date_format" class="field-control">
            <option value="%Y-%m-%d">2025-11-08</option>
            <option value="%d/%m/%Y">08/11/2025</option>
            <option value="%m/%d/%Y">11/08/2025</option>
          </select>
        </label>

        <label class="block text-sm">
          <span class="font-medium text-slate-700">Sort direction</span>
          <select v-model="form.sort_direction" class="field-control">
            <option value="newest_first">Newest first</option>
            <option value="oldest_first">Oldest first</option>
          </select>
        </label>

        <label class="block text-sm">
          <span class="font-medium text-slate-700">Pilot name</span>
          <input v-model="form.pilot_name" type="text" class="field-control" />
        </label>

        <label class="block text-sm">
          <span class="font-medium text-slate-700">Start date</span>
          <input v-model="form.start_date" type="date" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>

        <label class="flex items-center gap-2 text-sm sm:col-span-2">
          <input v-model="form.is_instructor" type="checkbox" class="rounded border-slate-300" />
          <span class="font-medium text-slate-700">Is instructor</span>
        </label>

        <label class="block text-sm sm:col-span-2">
          <span class="font-medium text-slate-700">Instructor from date</span>
          <input
            v-model="form.instructor_from_date"
            type="date"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
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

      <ActionButton type="submit" :busy="mutating">Save settings</ActionButton>
    </form>
  </div>
</template>
