<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import { sendClubInquiry } from '@/api/clubInquiries'
import { isApiError } from '@/api/errors'
import { renderTurnstile, turnstileSiteKey, type TurnstileWidget } from '@/composables/useTurnstile'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const SUPPORT_EMAIL = 'support@gliderpilotlogbook.co.uk'

const DEFAULT_MESSAGE =
  'Hello,\n\n' +
  'Our club would like to connect to Glider Pilot Logbook club automation, so that flights ' +
  'from our club system can be added to our pilots’ logbooks automatically.\n\n' +
  'Please get in touch to discuss the next steps.'

const form = reactive({
  club_name: '',
  contact_name: '',
  email: '',
  phone: '',
  message: DEFAULT_MESSAGE,
  website: '',
})

const fieldErrors = ref<Record<string, string>>({})
const formError = ref('')
const busy = ref(false)
const sent = ref(false)
const turnstileToken = ref('')
const turnstileEl = ref<HTMLElement | null>(null)
let turnstile: TurnstileWidget | null = null

const needsBotCheck = computed(() => Boolean(turnstileSiteKey()))

watch(
  () => props.open,
  async (open) => {
    if (open) {
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      await mountTurnstile()
    } else {
      document.removeEventListener('keydown', onKeydown)
      unmountTurnstile()
      if (sent.value) {
        resetForm()
      }
    }
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  unmountTurnstile()
})

async function mountTurnstile(): Promise<void> {
  if (!turnstileEl.value || turnstile) {
    return
  }
  try {
    turnstile = await renderTurnstile(turnstileEl.value, (token) => {
      turnstileToken.value = token
    })
  } catch {
    formError.value = `The security check could not load. Please email us at ${SUPPORT_EMAIL}.`
  }
}

function unmountTurnstile(): void {
  turnstile?.remove()
  turnstile = null
  turnstileToken.value = ''
}

function resetForm(): void {
  Object.assign(form, {
    club_name: '',
    contact_name: '',
    email: '',
    phone: '',
    message: DEFAULT_MESSAGE,
    website: '',
  })
  fieldErrors.value = {}
  formError.value = ''
  sent.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && !busy.value) {
    close()
  }
}

function close(): void {
  emit('close')
}

function validate(): boolean {
  const errors: Record<string, string> = {}
  if (!form.club_name.trim()) {
    errors.club_name = 'Please enter the club name.'
  }
  if (!form.contact_name.trim()) {
    errors.contact_name = 'Please enter your name.'
  }
  if (!form.email.trim() && !form.phone.trim()) {
    errors.email = 'Please give an email address or a phone number.'
  }
  fieldErrors.value = errors
  return Object.keys(errors).length === 0
}

async function submit(): Promise<void> {
  formError.value = ''
  if (!validate()) {
    return
  }
  if (needsBotCheck.value && !turnstileToken.value) {
    formError.value = 'Please complete the security check.'
    return
  }
  busy.value = true
  try {
    await sendClubInquiry({
      club_name: form.club_name.trim(),
      contact_name: form.contact_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      message: form.message.trim(),
      website: form.website,
      turnstile_token: turnstileToken.value,
    })
    sent.value = true
    unmountTurnstile()
  } catch (err) {
    turnstile?.reset()
    if (isApiError(err)) {
      const errors = err.fieldErrors()
      const mapped: Record<string, string> = {}
      for (const [key, messages] of Object.entries(errors)) {
        if (messages[0]) {
          mapped[key] = messages[0]
        }
      }
      fieldErrors.value = mapped
      if (err.status === 429) {
        formError.value = `Too many requests. Please try again later or email us at ${SUPPORT_EMAIL}.`
      } else if (Object.keys(mapped).length === 0) {
        formError.value = err.message || 'Something went wrong. Please try again.'
      }
    } else {
      formError.value = `Something went wrong. Please try again or email us at ${SUPPORT_EMAIL}.`
    }
  } finally {
    busy.value = false
  }
}

const inputClass =
  'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600'
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
    @click.self="!busy && close()"
  >
    <div
      class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="club-connect-title"
    >
      <button
        type="button"
        class="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:text-slate-600"
        aria-label="Close"
        :disabled="busy"
        @click="close"
      >
        <span aria-hidden="true" class="text-xl leading-none">&times;</span>
      </button>

      <template v-if="sent">
        <div class="py-6 text-center" data-testid="club-connect-thanks">
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700"
            aria-hidden="true"
          >
            ✓
          </div>
          <h2 id="club-connect-title" class="mt-4 text-xl font-semibold text-slate-900">
            Thank you!
          </h2>
          <p class="mt-2 text-sm text-slate-600">
            Your request has been received. We will get in touch with you shortly.
          </p>
          <ActionButton class="mt-6" @click="close">Close</ActionButton>
        </div>
      </template>

      <template v-else>
        <span
          class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
        >
          Free for clubs
        </span>
        <h2 id="club-connect-title" class="mt-3 text-xl font-semibold text-slate-900">
          Connect your club
        </h2>
        <p class="mt-1 text-sm text-slate-600">
          Tell us about your club and how to reach you. We will help you set up club automation.
        </p>

        <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
          <div>
            <label for="club-connect-club" class="text-sm font-medium text-slate-700"
              >Club name</label
            >
            <input
              id="club-connect-club"
              v-model="form.club_name"
              type="text"
              maxlength="200"
              autocomplete="organization"
              :class="inputClass"
            />
            <p v-if="fieldErrors.club_name" class="mt-1 text-xs text-red-600">
              {{ fieldErrors.club_name }}
            </p>
          </div>

          <div>
            <label for="club-connect-name" class="text-sm font-medium text-slate-700"
              >Your name</label
            >
            <input
              id="club-connect-name"
              v-model="form.contact_name"
              type="text"
              maxlength="200"
              autocomplete="name"
              :class="inputClass"
            />
            <p v-if="fieldErrors.contact_name" class="mt-1 text-xs text-red-600">
              {{ fieldErrors.contact_name }}
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="club-connect-email" class="text-sm font-medium text-slate-700"
                >Email</label
              >
              <input
                id="club-connect-email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                :class="inputClass"
              />
            </div>
            <div>
              <label for="club-connect-phone" class="text-sm font-medium text-slate-700"
                >Phone</label
              >
              <input
                id="club-connect-phone"
                v-model="form.phone"
                type="tel"
                maxlength="50"
                autocomplete="tel"
                :class="inputClass"
              />
            </div>
          </div>
          <p v-if="fieldErrors.email || fieldErrors.phone" class="-mt-2 text-xs text-red-600">
            {{ fieldErrors.email || fieldErrors.phone }}
          </p>
          <p v-else class="-mt-2 text-xs text-slate-500">
            An email address or a phone number is enough.
          </p>

          <div>
            <label for="club-connect-message" class="text-sm font-medium text-slate-700"
              >Message</label
            >
            <textarea
              id="club-connect-message"
              v-model="form.message"
              rows="6"
              maxlength="4000"
              :class="inputClass"
            />
            <p v-if="fieldErrors.message" class="mt-1 text-xs text-red-600">
              {{ fieldErrors.message }}
            </p>
          </div>

          <!-- Honeypot for bots: hidden from people and screen readers. -->
          <div class="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
            <label for="club-connect-website">Website</label>
            <input
              id="club-connect-website"
              v-model="form.website"
              type="text"
              tabindex="-1"
              autocomplete="off"
            />
          </div>

          <div v-if="needsBotCheck" ref="turnstileEl" class="min-h-[65px]" />

          <p v-if="formError" class="text-sm text-red-600" role="alert">{{ formError }}</p>

          <div
            class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <p class="text-xs text-slate-500">
              Or email us at
              <a
                :href="`mailto:${SUPPORT_EMAIL}`"
                class="font-medium text-sky-700 hover:underline"
                >{{ SUPPORT_EMAIL }}</a
              >
            </p>
            <ActionButton type="submit" :busy="busy">Send request</ActionButton>
          </div>
        </form>
      </template>
    </div>
  </div>
</template>
