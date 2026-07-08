<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Flight } from '@/types'

const props = defineProps<{
  flight?: Flight | null
  fieldErrors?: Record<string, string[]>
  saving?: boolean
}>()

const emit = defineEmits<{
  submit: [Record<string, unknown>]
  cancel: []
}>()

const LAUNCH_TYPES = ['Aerotow', 'Winch']

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
  landings: 0,
  is_instructor: false,
})

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
      form.landings = 0
      form.is_instructor = false
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
    form.launch_type = flight.launch_type
    form.landings = flight.landings
    form.is_instructor = flight.is_instructor
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
  <form class="space-y-6" @submit.prevent="onSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="block text-sm">
        <span class="font-medium text-slate-700">Date</span>
        <input
          v-model="form.date"
          type="date"
          required
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <span v-if="fieldError('date')" class="mt-1 block text-xs text-red-600">{{
          fieldError('date')
        }}</span>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Launch type</span>
        <input
          v-model="form.launch_type"
          type="text"
          list="launch-types"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <datalist id="launch-types">
          <option v-for="type in LAUNCH_TYPES" :key="type" :value="type" />
        </datalist>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Pilot</span>
        <input v-model="form.pilot" type="text" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Copilot</span>
        <input v-model="form.copilot" type="text" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Glider</span>
        <input v-model="form.glider" type="text" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Registration</span>
        <input
          v-model="form.registration"
          type="text"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Departure</span>
        <input
          v-model="form.departure_place"
          type="text"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Launch time</span>
        <input
          v-model="form.launch_time"
          type="time"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <span v-if="fieldError('launch_time')" class="mt-1 block text-xs text-red-600">{{
          fieldError('launch_time')
        }}</span>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Arrival</span>
        <input
          v-model="form.arrival_place"
          type="text"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>

      <label class="block text-sm">
        <span class="font-medium text-slate-700">Landing time</span>
        <input
          v-model="form.landing_time"
          type="time"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
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
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <span v-if="fieldError('landings')" class="mt-1 block text-xs text-red-600">{{
          fieldError('landings')
        }}</span>
      </label>

      <label class="flex items-center gap-2 text-sm sm:col-span-2">
        <input v-model="form.is_instructor" type="checkbox" class="rounded border-slate-300" />
        <span class="font-medium text-slate-700">Instructor flight</span>
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

    <div class="flex flex-wrap gap-3">
      <button
        type="submit"
        class="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
        :disabled="saving"
      >
        {{ saving ? 'Saving…' : flight ? 'Save changes' : 'Create flight' }}
      </button>
      <button
        type="button"
        class="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        @click="emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </form>
</template>
