<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import FlightForm from '@/components/FlightForm.vue'
import FormSheetLayout from '@/components/FormSheetLayout.vue'
import { isApiError } from '@/api/errors'
import { useFlights } from '@/composables/useFlights'
import { usePilotPrivileges } from '@/composables/usePilotPrivileges'
import { useSettings } from '@/composables/useSettings'
import { safeFlightsReturnTo } from '@/lib/flightListQuery'
import type { FlightCreateRequest } from '@/types'

const FLIGHT_CREATE_FORM_ID = 'flight-create-form'
const DESKTOP_MEDIA_QUERY = '(min-width: 640px)'

const router = useRouter()
const route = useRoute()
const flightsReturnTo = safeFlightsReturnTo(route.query.returnTo)
const { create, mutating, error, flights, list } = useFlights()
const { settings, fetch: fetchSettings } = useSettings()
const { isInstructorPrivilege, load: loadPilotPrivileges } = usePilotPrivileges()

const showInstructorFlight = computed(() =>
  isInstructorPrivilege(settings.value?.pilot_privilege ?? ''),
)

const fieldErrors = ref<Record<string, string[]>>({})
const submitError = ref<string | null>(null)
const isDesktop = ref(
  typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MEDIA_QUERY).matches : false,
)

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
  void loadPilotPrivileges()
  void fetchSettings()
  void list()
})

onUnmounted(() => {
  desktopMediaQuery?.removeEventListener('change', onMediaQueryChange)
  document.body.style.overflow = ''
})

function onCancel(): void {
  if (mutating.value) {
    return
  }
  void router.push(flightsReturnTo)
}

async function onSubmit(payload: Record<string, unknown>): Promise<void> {
  if (mutating.value) {
    return
  }

  fieldErrors.value = {}
  submitError.value = null
  try {
    const defaults = {
      pilot: settings.value?.pilot_name ?? '',
    }
    const flight = await create({ ...defaults, ...payload } as FlightCreateRequest)
    if (flight) {
      await router.push(flightsReturnTo)
    }
  } catch (err) {
    if (isApiError(err)) {
      submitError.value = err.message
      fieldErrors.value = err.fieldErrors()
    } else {
      submitError.value = 'Failed to create flight'
    }
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
        title="New flight"
        subtitle="Add a new entry to your logbook."
        title-id="flight-create-title"
        :back-disabled="mutating"
        @back="onCancel"
      >
        <div class="space-y-4">
          <ErrorBanner v-if="error || submitError" :message="error || submitError || ''" />
          <FlightForm
            :form-id="FLIGHT_CREATE_FORM_ID"
            :flights="flights"
            :field-errors="fieldErrors"
            :saving="mutating"
            :show-actions="false"
            :show-instructor-flight="showInstructorFlight"
            @submit="onSubmit"
            @cancel="onCancel"
          />
        </div>

        <template #footer>
          <div class="flex w-full gap-3 sm:justify-end">
            <ActionButton
              variant="secondary"
              class="flex-1 sm:flex-none"
              :disabled="mutating"
              @click="onCancel"
            >
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              :form="FLIGHT_CREATE_FORM_ID"
              class="flex-1 sm:flex-none"
              :busy="mutating"
            >
              Create flight
            </ActionButton>
          </div>
        </template>
      </FormSheetLayout>
    </div>
  </Teleport>
</template>
