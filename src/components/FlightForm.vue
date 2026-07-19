<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import DatalistInput from '@/components/DatalistInput.vue'
import { collectFlightFieldSuggestions } from '@/lib/flightSuggestions'
import { launchTypeSelectOptions, normalizeLaunchTypeCode } from '@/lib/launchTypes'
import type { Flight } from '@/types'

const props = withDefaults(
  defineProps<{
    flight?: Flight | null
    flights?: readonly Flight[]
    fieldErrors?: Record<string, string[]>
    saving?: boolean
    formId?: string
    showActions?: boolean
  }>(),
  {
    formId: 'flight-form',
    showActions: true,
  },
)

const emit = defineEmits<{
  submit: [Record<string, unknown>]
  cancel: []
}>()

const fieldClass = 'field-control'

const form = reactive({
  date: '',
  pilot: '',
  copilot: '',
  glider: '',
  registration: '',
  departure_place: '',
  launch_time: '',
  arrival_place: '',
  landing_time: '',
  launch_type: '',
  landings: 1,
  is_instructor: false,
  remarks: '',
})

const fieldSuggestions = computed(() => collectFlightFieldSuggestions(props.flights ?? []))

const launchTypes = computed(() => launchTypeSelectOptions(form.launch_type))

watch(
  () => props.flight,
  (flight) => {
    if (!flight) {
      form.date = new Date().toISOString().slice(0, 10)
      form.pilot = ''
      form.copilot = ''
      form.glider = ''
      form.registration = ''
      form.departure_place = ''
      form.launch_time = ''
      form.arrival_place = ''
      form.landing_time = ''
      form.launch_type = ''
      form.landings = 1
      form.is_instructor = false
      form.remarks = ''
      return
    }
    form.date = flight.date
    form.pilot = flight.pilot
    form.copilot = flight.copilot
    form.glider = flight.glider
    form.registration = flight.registration
    form.departure_place = flight.departure_place
    form.launch_time = flight.launch_time
    form.arrival_place = flight.arrival_place
    form.landing_time = flight.landing_time
    form.launch_type = normalizeLaunchTypeCode(flight.launch_type)
    form.landings = flight.landings
    form.is_instructor = flight.is_instructor
    form.remarks = flight.remarks
  },
  { immediate: true },
)

function fieldError(name: string): string | undefined {
  return props.fieldErrors?.[name]?.[0]
}

function onSubmit(): void {
  emit('submit', { ...form })
}
</script>

<template>
  <form :id="formId" class="space-y-6" @submit.prevent="onSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="block text-sm">
        <span class="font-medium text-slate-700">Date</span>
        <input
          v-model="form.date"
          type="date"
          required
          :class="fieldClass"
        />
        <span v-if="fieldError('date')" class="mt-1 block text-xs text-red-600">{{
          fieldError('date')
        }}</span>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Launch type</span>
        <select v-model="form.launch_type" :class="fieldClass">
          <option value="">Select launch type</option>
          <option v-for="option in launchTypes" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <span v-if="fieldError('launch_type')" class="mt-1 block text-xs text-red-600">{{
          fieldError('launch_type')
        }}</span>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Pilot</span>
        <DatalistInput
          v-model="form.pilot"
          list-id="flight-pilot-options"
          :options="fieldSuggestions.pilot"
        />
        <span v-if="fieldError('pilot')" class="mt-1 block text-xs text-red-600">{{
          fieldError('pilot')
        }}</span>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Copilot</span>
        <DatalistInput
          v-model="form.copilot"
          list-id="flight-copilot-options"
          :options="fieldSuggestions.copilot"
        />
        <span v-if="fieldError('copilot')" class="mt-1 block text-xs text-red-600">{{
          fieldError('copilot')
        }}</span>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Glider</span>
        <DatalistInput
          v-model="form.glider"
          list-id="flight-glider-options"
          :options="fieldSuggestions.glider"
        />
        <span v-if="fieldError('glider')" class="mt-1 block text-xs text-red-600">{{
          fieldError('glider')
        }}</span>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Registration</span>
        <DatalistInput
          v-model="form.registration"
          list-id="flight-registration-options"
          :options="fieldSuggestions.registration"
        />
        <span v-if="fieldError('registration')" class="mt-1 block text-xs text-red-600">{{
          fieldError('registration')
        }}</span>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Departure</span>
        <DatalistInput
          v-model="form.departure_place"
          list-id="flight-departure-options"
          :options="fieldSuggestions.departure_place"
        />
        <span v-if="fieldError('departure_place')" class="mt-1 block text-xs text-red-600">{{
          fieldError('departure_place')
        }}</span>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Launch time</span>
        <input
          v-model="form.launch_time"
          type="time"
          :class="fieldClass"
        />
        <span v-if="fieldError('launch_time')" class="mt-1 block text-xs text-red-600">{{
          fieldError('launch_time')
        }}</span>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Arrival</span>
        <DatalistInput
          v-model="form.arrival_place"
          list-id="flight-arrival-options"
          :options="fieldSuggestions.arrival_place"
        />
        <span v-if="fieldError('arrival_place')" class="mt-1 block text-xs text-red-600">{{
          fieldError('arrival_place')
        }}</span>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Landing time</span>
        <input
          v-model="form.landing_time"
          type="time"
          :class="fieldClass"
        />
        <span v-if="fieldError('landing_time')" class="mt-1 block text-xs text-red-600">{{
          fieldError('landing_time')
        }}</span>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Landings</span>
        <input
          v-model.number="form.landings"
          type="number"
          min="0"
          :class="fieldClass"
        />
        <span v-if="fieldError('landings')" class="mt-1 block text-xs text-red-600">{{
          fieldError('landings')
        }}</span>
      </label>

      <label class="flex items-center gap-2 text-sm sm:col-span-2">
        <input v-model="form.is_instructor" type="checkbox" class="rounded border-slate-300" />
        <span class="font-medium text-slate-700">Instructor flight</span>
      </label>

      <label class="block text-sm sm:col-span-2">
        <span class="font-medium text-slate-700">Remarks and endorsements</span>
        <textarea
          v-model="form.remarks"
          rows="4"
          :class="fieldClass"
          placeholder="Instructor endorsements, notes, etc."
        />
        <span v-if="fieldError('remarks')" class="mt-1 block text-xs text-red-600">{{
          fieldError('remarks')
        }}</span>
      </label>
    </div>

    <div
      v-if="flight"
      class="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2"
    >
      <div><span class="text-slate-500">Flight time:</span> {{ flight.flight_time || '—' }}</div>
      <div><span class="text-slate-500">PIC time:</span> {{ flight.pic_time || '—' }}</div>
      <div><span class="text-slate-500">Dual time:</span> {{ flight.dual_time || '—' }}</div>
      <div>
        <span class="text-slate-500">Instructor time:</span> {{ flight.instructor_time || '—' }}
      </div>
      <div><span class="text-slate-500">Row:</span> {{ flight.row_number }}</div>
    </div>

    <div v-if="showActions" class="flex flex-wrap gap-3">
      <ActionButton type="submit" :busy="saving">
        {{ flight ? 'Save changes' : 'Create flight' }}
      </ActionButton>
      <ActionButton variant="secondary" :disabled="saving" @click="emit('cancel')">
        Cancel
      </ActionButton>
    </div>
  </form>
</template>
