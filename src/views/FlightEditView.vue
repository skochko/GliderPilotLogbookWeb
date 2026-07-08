<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorBanner from '@/components/ErrorBanner.vue'
import FlightForm from '@/components/FlightForm.vue'
import LoadingState from '@/components/LoadingState.vue'
import { isApiError } from '@/api/errors'
import { useFlights } from '@/composables/useFlights'
import { decodeFlightId } from '@/lib/flightId'
import type { Flight, FlightPatchRequest } from '@/types'

const route = useRoute()
const router = useRouter()
const { get, update, loading, error } = useFlights()

const flight = ref<Flight | null>(null)
const fieldErrors = ref<Record<string, string[]>>({})
const saving = ref(false)
const submitError = ref<string | null>(null)
const notFound = ref(false)

const flightId = decodeFlightId(route.params.id as string)

onMounted(async () => {
  flight.value = await get(flightId)
  if (!flight.value) {
    notFound.value = true
  }
})

async function onSubmit(payload: Record<string, unknown>): Promise<void> {
  fieldErrors.value = {}
  submitError.value = null
  saving.value = true
  try {
    const updated = await update(flightId, payload as FlightPatchRequest)
    if (updated) {
      flight.value = updated
      await router.push('/flights')
    }
  } catch (err) {
    if (isApiError(err)) {
      submitError.value = err.message
      fieldErrors.value = err.fieldErrors()
    } else {
      submitError.value = 'Failed to update flight'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Edit flight</h1>
      <p class="mt-1 text-slate-600">Update flight details in your logbook.</p>
    </div>

    <LoadingState v-if="loading && !flight && !notFound" />
    <div v-else-if="notFound" class="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
      Flight not found.
    </div>

    <template v-else-if="flight">
      <ErrorBanner v-if="error || submitError" :message="error || submitError || ''" />
      <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <FlightForm
          :flight="flight"
          :field-errors="fieldErrors"
          :saving="saving"
          @submit="onSubmit"
          @cancel="router.push('/flights')"
        />
      </div>
    </template>
  </div>
</template>
