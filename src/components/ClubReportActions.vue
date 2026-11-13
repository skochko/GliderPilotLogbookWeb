<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import { downloadClubReport, emailClubReport } from '@/api/instructorOversight'
import { isApiError } from '@/api/errors'
import { useProfile } from '@/composables/useProfile'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ organizationName: string; asOf: string }>()

const { profile, save } = useProfile()
const toast = useToast()

const recipient = computed(() => profile.value?.effective_report_email ?? '')
const usesAccountEmail = computed(() => !profile.value?.report_email)

const editing = ref(false)
const draftEmail = ref('')
const savingEmail = ref(false)
const emailError = ref<string | null>(null)
const sending = ref(false)
const downloading = ref(false)
const actionError = ref<string | null>(null)
const emailInput = ref<HTMLInputElement | null>(null)

async function startEditing(): Promise<void> {
  draftEmail.value = profile.value?.report_email || recipient.value
  emailError.value = null
  editing.value = true
  await nextTick()
  emailInput.value?.focus()
  emailInput.value?.select()
}

function cancelEditing(): void {
  editing.value = false
  emailError.value = null
}

async function saveEmail(): Promise<void> {
  const value = draftEmail.value.trim()
  if (value && !emailInput.value?.checkValidity()) {
    emailError.value = 'Enter a valid email address.'
    return
  }
  savingEmail.value = true
  emailError.value = null
  try {
    // An address equal to the account email is stored as empty so it keeps following
    // the account email if that ever changes.
    const reportEmail = value.toLowerCase() === profile.value?.email.toLowerCase() ? '' : value
    await save({ report_email: reportEmail })
    editing.value = false
  } catch (err) {
    emailError.value = isApiError(err) ? err.message : 'Could not save the email address.'
  } finally {
    savingEmail.value = false
  }
}

async function sendReport(): Promise<void> {
  sending.value = true
  actionError.value = null
  try {
    const result = await emailClubReport()
    toast.show(`Report sent to ${result.recipient}`, 'success')
  } catch (err) {
    actionError.value = isApiError(err) ? err.message : 'Could not send the report.'
  } finally {
    sending.value = false
  }
}

async function downloadReport(): Promise<void> {
  downloading.value = true
  actionError.value = null
  try {
    const blob = await downloadClubReport()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const slug =
      props.organizationName
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'club'
    link.href = url
    link.download = `${slug}-instructor-report-${props.asOf}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (err) {
    actionError.value = isApiError(err) ? err.message : 'Could not download the report.'
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div class="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
    <div class="flex flex-wrap gap-2">
      <ActionButton
        variant="secondary"
        class="flex-1 sm:flex-none"
        :busy="downloading"
        :disabled="sending"
        data-action="download-club-report"
        @click="downloadReport"
      >
        {{ downloading ? 'Downloading…' : 'Download PDF' }}
      </ActionButton>
      <ActionButton
        variant="secondary"
        class="flex-1 sm:flex-none"
        :busy="sending"
        :disabled="editing || !recipient || downloading"
        data-action="email-club-report"
        @click="sendReport"
      >
        {{ sending ? 'Sending…' : 'Email report' }}
      </ActionButton>
    </div>

    <p v-if="!editing" class="text-xs text-slate-500 sm:text-right" data-testid="report-recipient">
      Sends to
      <strong class="break-all font-medium text-slate-800">{{ recipient || 'no address' }}</strong>
      <template v-if="usesAccountEmail && recipient"> (account email)</template>
      ·
      <button
        type="button"
        class="font-medium text-sky-700 underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        data-action="change-report-email"
        @click="startEditing"
      >
        Change
      </button>
    </p>

    <form
      v-else
      class="w-full sm:w-80"
      novalidate
      data-testid="report-email-form"
      @submit.prevent="saveEmail"
      @keydown.esc.prevent="cancelEditing"
    >
      <label for="report-email" class="block text-xs font-medium text-slate-700">
        Send reports to
      </label>
      <input
        id="report-email"
        ref="emailInput"
        v-model="draftEmail"
        type="email"
        autocomplete="email"
        inputmode="email"
        class="field-control mt-1"
        :aria-invalid="emailError ? 'true' : 'false'"
        aria-describedby="report-email-hint report-email-error"
      />
      <p id="report-email-hint" class="mt-1 text-xs text-slate-500">
        Leave empty to use your account email ({{ profile?.email }}).
      </p>
      <p
        v-if="emailError"
        id="report-email-error"
        class="mt-1 text-xs font-medium text-red-700"
        role="alert"
      >
        {{ emailError }}
      </p>
      <div class="mt-2 flex justify-end gap-2">
        <ActionButton variant="secondary" :disabled="savingEmail" @click="cancelEditing">
          Cancel
        </ActionButton>
        <ActionButton type="submit" :busy="savingEmail">Save</ActionButton>
      </div>
    </form>

    <p
      v-if="actionError"
      class="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:w-80"
      role="alert"
    >
      {{ actionError }}
    </p>
  </div>
</template>
