<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import FlightForm from '@/components/FlightForm.vue'
import FlightMediaSection from '@/components/FlightMediaSection.vue'
import FormSheetLayout from '@/components/FormSheetLayout.vue'
import LoadingState from '@/components/LoadingState.vue'
import { isApiError } from '@/api/errors'
import { useFlights } from '@/composables/useFlights'
import { decodeFlightId } from '@/lib/flightId'
import type { Flight, FlightPatchRequest } from '@/types'

const FLIGHT_EDIT_FORM_ID = 'flight-edit-form'
const DESKTOP_MEDIA_QUERY = '(min-width: 640px)'

const route = useRoute()
const router = useRouter()
const { get, update, remove, mutating, error, flights, list } = useFlights()

const flight = ref<Flight | null>(null)
const fieldErrors = ref<Record<string, string[]>>({})
const submitError = ref<string | null>(null)
const pageReady = ref(false)
const deleteOpen = ref(false)
const isDesktop = ref(
  typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MEDIA_QUERY).matches : false,
)

const flightId = decodeFlightId(route.params.id as string)

let desktopMediaQuery: MediaQueryList | null = null

function syncBodyScrollLock(): void {
  document.body.style.overflow = isDesktop.value ? '' : 'hidden'
}

function onMediaQueryChange(): void {
  isDesktop.value = desktopMediaQuery?.matches ?? false
  syncBodyScrollLock()
}

onMounted(() => {
  desktopMediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
  onMediaQueryChange()
  desktopMediaQuery.addEventListener('change', onMediaQueryChange)
  void Promise.all([get(flightId), list()])
    .then(([result]) => {
      flight.value = result
    })
    .finally(() => {
      pageReady.value = true
    })
})

onUnmounted(() => {
  desktopMediaQuery?.removeEventListener('change', onMediaQueryChange)
  document.body.style.overflow = ''
})

function onCancel(): void {
  if (mutating.value) {
    return
  }
  void router.push('/flights')
}

async function onSubmit(payload: Record<string, unknown>): Promise<void> {
  if (mutating.value) {
    return
  }

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

async function confirmDelete(): Promise<void> {
  if (mutating.value) {
    return
  }

  const ok = await remove(flightId)
  if (ok) {
    deleteOpen.value = false
    await router.push('/flights')
  }
}
</script>

<template>
  <Teleport to="body" :disabled="isDesktop">
    <div
      class="flex min-h-0 flex-col bg-white"
      :class="
        isDesktop
          ? 'relative min-h-[36rem] overflow-hidden rounded-lg border border-slate-200 shadow-sm'
          : 'fixed inset-0 z-50 h-dvh'
      "
    >
      <FormSheetLayout
        class="min-h-0 flex-1"
        title="Edit flight"
        subtitle="Update flight details in your logbook."
        title-id="flight-edit-title"
        :back-disabled="mutating"
        @back="onCancel"
      >
        <LoadingState v-if="!pageReady" label="Loading flight details…" />
        <p v-else-if="!flight" class="text-slate-600">Flight not found.</p>

        <template v-else>
          <div class="space-y-6">
            <ErrorBanner v-if="error || submitError" :message="error || submitError || ''" />
            <FlightForm
              :form-id="FLIGHT_EDIT_FORM_ID"
              :flight="flight"
              :flights="flights"
              :field-errors="fieldErrors"
              :saving="mutating"
              :show-actions="false"
              @submit="onSubmit"
              @cancel="onCancel"
            />
            <FlightMediaSection
              :flight-id="flightId"
              :media="flight.media"
              @updated="flight = $event"
            />
          </div>
        </template>

        <template v-if="pageReady && flight" #footer>
          <div class="flex w-full gap-3 sm:justify-end">
            <ActionButton
              variant="secondary"
              class="min-w-0 flex-1"
              :disabled="mutating"
              @click="onCancel"
            >
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              :form="FLIGHT_EDIT_FORM_ID"
              class="min-w-0 flex-1"
              :busy="mutating"
            >
              Save
            </ActionButton>
          </div>
          <button
            type="button"
            class="w-full py-1 text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-center"
            :disabled="mutating"
            @click="deleteOpen = true"
          >
            Delete flight
          </button>
        </template>
      </FormSheetLayout>
    </div>
  </Teleport>

  <ConfirmDialog
    :open="deleteOpen"
    title="Delete flight"
    message="This will permanently remove the flight row from your spreadsheet."
    confirm-label="Delete"
    :busy="mutating"
    @confirm="confirmDelete"
    @cancel="deleteOpen = false"
  />
</template>
