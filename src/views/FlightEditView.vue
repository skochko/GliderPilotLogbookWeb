<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorBanner from '@/components/ErrorBanner.vue'
import FlightForm from '@/components/FlightForm.vue'
import FlightMediaSection from '@/components/FlightMediaSection.vue'
import LoadingState from '@/components/LoadingState.vue'
import { isApiError } from '@/api/errors'
import { useFlights } from '@/composables/useFlights'
import { decodeFlightId } from '@/lib/flightId'
import type { Flight, FlightPatchRequest } from '@/types'

const route = useRoute()
const router = useRouter()
const { get, update, mutating, error, flights, list } = useFlights()

const flight = ref<Flight | null>(null)
const fieldErrors = ref<Record<string, string[]>>({})
const submitError = ref<string | null>(null)
const pageReady = ref(false)

const flightId = decodeFlightId(route.params.id as string)

void Promise.all([get(flightId), list()])
  .then(([result]) => {
    flight.value = result
  })
  .finally(() => {
    pageReady.value = true
  })

async function onSubmit(payload: Record<string, unknown>): Promise<void> {
  if (mutating.value) return

  fieldErrors.value = {}
  submitError.value = null
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
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Edit flight</h1>
      <p class="mt-1 text-slate-600">Update flight details in your logbook.</p>
    </div>

    <LoadingState v-if="!pageReady" label="Loading flight details…" />
    <div
      v-else-if="!flight"
      class="rounded-lg border border-slate-200 bg-white p-6 text-slate-600"
    >
      Flight not found.
    </div>

    <template v-else-if="flight">
      <ErrorBanner v-if="error || submitError" :message="error || submitError || ''" />
      <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <FlightForm
          :flight="flight"
          :flights="flights"
          :field-errors="fieldErrors"
          :saving="mutating"
          @submit="onSubmit"
          @cancel="router.push('/flights')"
        />
        <FlightMediaSection
          :flight-id="flightId"
          :media="flight.media"
          @updated="flight = $event"
        />
      </div>
    </template>
  </div>
</template>
