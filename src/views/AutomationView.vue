<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ActionButton from '@/components/ActionButton.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { listOrganizations, type OrganizationListItem } from '@/api/organizations'
import { useAutomation } from '@/composables/useAutomation'
import { useFlashMessage } from '@/composables/useFlashMessage'
import { useSettings } from '@/composables/useSettings'
import { automationStatusLabel, automationStatusStyles } from '@/lib/automationStatus'
import { formatDateTime } from '@/lib/dates'

const { requests, loading, initialized, mutating, error, fetch, create } = useAutomation()
const { settings, fetch: fetchSettings } = useSettings()
const { show } = useFlashMessage()

const organizations = ref<OrganizationListItem[]>([])
const organizationsLoading = ref(true)
const organizationsError = ref<string | null>(null)
const selectedOrganizationId = ref<number | null>(null)
const pilotName = ref('')
const submitError = ref<string | null>(null)

const requestedOrganizationIds = computed(
  () => new Set(requests.value.map((request) => request.organization_id)),
)

const availableOrganizations = computed(() =>
  organizations.value.filter((org) => !requestedOrganizationIds.value.has(org.id)),
)

const canCreateRequest = computed(
  () => availableOrganizations.value.length > 0 && selectedOrganizationId.value != null,
)

onMounted(async () => {
  await Promise.all([fetch(), loadOrganizations(), fetchSettings()])
  if (settings.value?.pilot_name) {
    pilotName.value = settings.value.pilot_name
  }
})

async function loadOrganizations(): Promise<void> {
  organizationsLoading.value = true
  organizationsError.value = null
  try {
    organizations.value = await listOrganizations()
  } catch {
    organizationsError.value = 'Failed to load organizations.'
  } finally {
    organizationsLoading.value = false
  }
}

async function onSubmit(): Promise<void> {
  if (mutating.value || selectedOrganizationId.value == null) return

  submitError.value = null
  const created = await create({
    organization_id: selectedOrganizationId.value,
    pilot_name: pilotName.value.trim() || undefined,
  })

  if (created) {
    selectedOrganizationId.value = null
    show(`Connection request sent to ${created.organization_name}.`, 'success')
  } else if (error.value) {
    submitError.value = error.value
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Automation</h1>
      <p class="mt-1 text-slate-600">
        Request automatic flight import from your gliding club. Each club can only have one active
        request.
      </p>
    </div>

    <LoadingState v-if="!initialized" />
    <ErrorBanner v-else-if="error && !requests.length" :message="error" :retry-busy="loading" @retry="fetch" />
    <ErrorBanner v-if="submitError" :message="submitError" />

    <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="font-semibold text-slate-900">Your requests</h2>

      <p v-if="initialized && !requests.length" class="mt-4 text-sm text-slate-600">
        You have not submitted any club connection requests yet.
      </p>

      <div v-else-if="requests.length" class="mt-4 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-slate-200 text-slate-500">
            <tr>
              <th class="px-3 py-2 font-medium">Organization</th>
              <th class="px-3 py-2 font-medium">Status</th>
              <th class="px-3 py-2 font-medium">Pilot name</th>
              <th class="px-3 py-2 font-medium">Submitted</th>
              <th class="px-3 py-2 font-medium">Logbook</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="request in requests" :key="request.id">
              <td class="px-3 py-3 font-medium text-slate-900">{{ request.organization_name }}</td>
              <td class="px-3 py-3">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
                  :class="automationStatusStyles(request.status)"
                >
                  {{ automationStatusLabel(request.status) }}
                </span>
              </td>
              <td class="px-3 py-3 text-slate-700">{{ request.pilot_name }}</td>
              <td class="px-3 py-3 text-slate-600">{{ formatDateTime(request.created_at) }}</td>
              <td class="px-3 py-3">
                <a
                  :href="request.logbook_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sky-700 hover:underline"
                >
                  {{ request.logbook_title || 'Open logbook' }}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="font-semibold text-slate-900">New request</h2>
      <p class="mt-1 text-sm text-slate-600">
        We will email the organization with your logbook details and contact email.
      </p>

      <LoadingState v-if="organizationsLoading" class="mt-4" />
      <ErrorBanner
        v-else-if="organizationsError"
        class="mt-4"
        :message="organizationsError"
        :retry-busy="organizationsLoading"
        @retry="loadOrganizations"
      />

      <template v-else>
        <p v-if="availableOrganizations.length === 0" class="mt-4 text-sm text-slate-600">
          You already have connection requests for all available organizations.
        </p>

        <form v-else class="mt-4 space-y-4" @submit.prevent="onSubmit">
          <label class="block text-sm">
            <span class="font-medium text-slate-700">Organization</span>
            <select v-model="selectedOrganizationId" class="field-control" required>
              <option :value="null">Select organization…</option>
              <option v-for="org in availableOrganizations" :key="org.id" :value="org.id">
                {{ org.name }}
              </option>
            </select>
          </label>

          <label class="block text-sm">
            <span class="font-medium text-slate-700">Pilot name</span>
            <input v-model="pilotName" type="text" class="field-control" required />
          </label>

          <ActionButton type="submit" :busy="mutating" :disabled="!canCreateRequest">
            Send connection request
          </ActionButton>
        </form>
      </template>
    </section>
  </div>
</template>
