<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { listOrganizations, type OrganizationListItem } from '@/api/organizations'
import { useAuth } from '@/composables/useAuth'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useLogbook } from '@/composables/useLogbook'
import { usePilotPrivileges } from '@/composables/usePilotPrivileges'

const router = useRouter()
const { user, fetchMe } = useAuth()
const { create, creationJob, mutating, error, resumeCreate, stopCreatePolling } = useLogbook()
const { show } = useFlashMessage()
const {
  options: pilotPrivilegeOptions,
  loading: loadingPilotPrivileges,
  load: loadPilotPrivileges,
} = usePilotPrivileges()
const pilotName = ref('')
const pilotPrivilege = ref('SPL Pilot')
const organizationId = ref<number | null>(null)
const consent = ref(false)
const organizations = ref<OrganizationListItem[]>([])
const loadingOrganizations = ref(true)
const validationError = ref<string | null>(null)
const stageLabels: Record<string, string> = {
  queued: 'Waiting to start…',
  preparing: 'Preparing your logbook…',
  copying_template: 'Copying the Google Sheets template…',
  applying_structure: 'Applying sheets, formulas, and protections…',
  connecting: 'Connecting your new logbook…',
  finishing: 'Finishing setup…',
  complete: 'Logbook created.',
}
const creationInProgress = computed(
  () => creationJob.value !== null && ['queued', 'running'].includes(creationJob.value.status),
)
const creationStageLabel = computed(() =>
  creationJob.value ? (stageLabels[creationJob.value.stage] ?? 'Creating your logbook…') : '',
)

onMounted(async () => {
  void loadPilotPrivileges()
  await prefillPilotName()
  void resumePreviouslyStartedCreation()
  try {
    organizations.value = await listOrganizations()
  } finally {
    loadingOrganizations.value = false
  }
})

async function prefillPilotName(): Promise<void> {
  if (pilotName.value.trim()) return

  const currentUser = user.value ?? (await fetchMe())
  if (!currentUser || currentUser.name.trim() === currentUser.email.trim()) return

  pilotName.value = currentUser.name.trim()
}

onUnmounted(() => {
  stopCreatePolling()
})

async function resumePreviouslyStartedCreation(): Promise<void> {
  const response = await resumeCreate()
  if (response) {
    await finishCreation()
  }
}

async function submit(): Promise<void> {
  validationError.value = null
  if (!pilotName.value.trim()) {
    validationError.value = 'Pilot name is required.'
    return
  }
  if (organizationId.value !== null && !consent.value) {
    validationError.value = 'Please confirm the club automation consent.'
    return
  }
  const response = await create({
    pilot_name: pilotName.value.trim(),
    pilot_privilege: pilotPrivilege.value,
    source: 'direct',
    organization_id: organizationId.value,
    automation_consent: consent.value,
  })
  if (response) {
    await finishCreation()
  }
}

async function finishCreation(): Promise<void> {
  await fetchMe()
  show('Logbook created. Complete the additional setup to use all features.', 'success')
  await router.push('/logbook/setup')
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6 py-8">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Create your logbook</h1>
      <p class="mt-2 text-slate-600">Enter your name, then optionally connect a club automation.</p>
    </div>
    <ErrorBanner v-if="error" :message="error" :retry-busy="mutating" @retry="submit" />
    <ErrorBanner v-if="validationError" :message="validationError" />
    <section
      v-if="creationInProgress"
      class="space-y-3 rounded-lg border border-sky-200 bg-sky-50 p-5"
      aria-live="polite"
    >
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="font-semibold text-sky-950">Creating your logbook</h2>
          <p class="mt-1 text-sm text-sky-800">{{ creationStageLabel }}</p>
        </div>
        <span class="text-sm font-medium text-sky-800">{{ creationJob?.percent ?? 0 }}%</span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-sky-100">
        <div
          class="h-full rounded-full bg-sky-600 transition-all duration-500"
          :style="{ width: `${Math.max(creationJob?.percent ?? 0, 5)}%` }"
        />
      </div>
      <p class="text-xs text-sky-700">This may take a few minutes. Please keep this page open.</p>
    </section>
    <form
      class="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="submit"
    >
      <section>
        <h2 class="text-lg font-semibold text-slate-900">1. Pilot name</h2>
        <label class="mt-3 block text-sm">
          <span class="font-medium text-slate-700">Name <span class="text-red-600">*</span></span>
          <input v-model="pilotName" type="text" class="field-control" required autofocus />
        </label>
        <label class="mt-3 block text-sm">
          <span class="font-medium text-slate-700">Pilot privilege</span>
          <select v-model="pilotPrivilege" class="field-control" :disabled="loadingPilotPrivileges">
            <option v-for="option in pilotPrivilegeOptions" :key="option.code" :value="option.code">
              {{ option.name }}
            </option>
          </select>
        </label>
      </section>
      <section>
        <h2 class="text-lg font-semibold text-slate-900">2. Club automation (optional)</h2>
        <LoadingState v-if="loadingOrganizations" />
        <label v-else class="mt-3 block text-sm">
          <span class="font-medium text-slate-700">Club</span>
          <select v-model="organizationId" class="field-control">
            <option :value="null">No club for now</option>
            <option
              v-for="organization in organizations"
              :key="organization.id"
              :value="organization.id"
            >
              {{ organization.name }}
            </option>
          </select>
        </label>
        <label
          v-if="organizationId !== null"
          class="mt-4 flex items-start gap-3 text-sm text-slate-700"
        >
          <input v-model="consent" type="checkbox" class="mt-1" />
          <span
            >I agree that this club may receive access to my logbook to add flight records.</span
          >
        </label>
        <p v-if="organizationId !== null" class="mt-2 text-sm text-slate-500">
          Inactive clubs are recorded as interest only; no spreadsheet access is granted.
        </p>
      </section>
      <ActionButton type="submit" class="ml-auto" :busy="mutating">Create logbook</ActionButton>
    </form>
  </div>
</template>
