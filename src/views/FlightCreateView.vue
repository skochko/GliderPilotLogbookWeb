<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ErrorBanner from '@/components/ErrorBanner.vue'
import FlightForm from '@/components/FlightForm.vue'
import LoadingState from '@/components/LoadingState.vue'
import { isApiError } from '@/api/errors'
import { useFlights } from '@/composables/useFlights'
import { useSettings } from '@/composables/useSettings'
import type { FlightCreateRequest } from '@/types'

const router = useRouter()
const { create, loading, error } = useFlights()
const { settings, fetch: fetchSettings } = useSettings()

const fieldErrors = ref<Record<string, string[]>>({})
const saving = ref(false)
const submitError = ref<string | null>(null)

onMounted(fetchSettings)

async function onSubmit(payload: Record<string, unknown>): Promise<void> {
  fieldErrors.value = {}
  submitError.value = null
  saving.value = true
  try {
    const defaults = {
      pilot: settings.value?.pilot_name ?? '',
      is_instructor: settings.value?.is_instructor ?? false,
    }
    const flight = await create({ ...defaults, ...payload } as FlightCreateRequest)
    if (flight) {
      await router.push('/flights')
    }
  } catch (err) {
    if (isApiError(err)) {
      submitError.value = err.message
      fieldErrors.value = err.fieldErrors()
    } else {
      submitError.value = 'Failed to create flight'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">New flight</h1>
      <p class="mt-1 text-slate-600">Add a new entry to your logbook.</p>
    </div>

    <ErrorBanner v-if="error || submitError" :message="error || submitError || ''" />
    <LoadingState v-if="loading && saving" label="Creating flight…" />

    <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <FlightForm
        :field-errors="fieldErrors"
        :saving="saving"
        @submit="onSubmit"
        @cancel="router.push('/flights')"
      />
    </div>
  </div>
</template>
