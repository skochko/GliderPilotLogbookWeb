<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ClubInstructorsTable from '@/components/ClubInstructorsTable.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { downloadClubInstructorReport } from '@/api/instructorOversight'
import { isApiError } from '@/api/errors'
import { useInstructorOversight } from '@/composables/useInstructorOversight'
import { useProfile } from '@/composables/useProfile'
import { formatDisplayDate } from '@/lib/dates'
import type { ClubInstructor } from '@/types/instructorOversight'

const router = useRouter()
const { profile, initialized: profileInitialized, fetch: fetchProfile } = useProfile()
const { overview, loading, initialized, error, fetchOverview } = useInstructorOversight()
const downloadingProfileId = ref<number | null>(null)
const downloadError = ref<string | null>(null)

const staleCount = computed(
  () => overview.value?.instructors.filter((item) => item.data_status === 'stale').length ?? 0,
)

onMounted(async () => {
  if (!profileInitialized.value) await fetchProfile()
  if (!profile.value?.capabilities.can_view_club_instructor_reports) {
    await router.replace({ name: 'dashboard' })
    return
  }
  await fetchOverview()
})

async function downloadReport(instructor: ClubInstructor): Promise<void> {
  downloadError.value = null
  downloadingProfileId.value = instructor.profile_id
  try {
    const blob = await downloadClubInstructorReport(instructor.profile_id)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${
      instructor.instructor_name
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'instructor'
    }-activity-report.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (err) {
    downloadError.value = isApiError(err) ? err.message : 'Could not download the report.'
  } finally {
    downloadingProfileId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Club Instructors</h1>
          <p class="mt-1 text-slate-600">
            Instructor activity and renewal information for
            {{ overview?.organization.name ?? 'your club' }}.
          </p>
        </div>
        <div v-if="overview" class="text-right text-sm text-slate-500">
          <p class="font-medium uppercase text-slate-700">{{ overview.viewer_role }}</p>
          <p>As of {{ formatDisplayDate(overview.as_of) }}</p>
        </div>
      </div>
    </div>

    <LoadingState v-if="!initialized && loading" label="Loading club instructors…" />
    <ErrorBanner v-else-if="error" :message="error" :retry-busy="loading" @retry="fetchOverview" />

    <template v-else-if="overview">
      <div
        v-if="staleCount"
        class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        {{ staleCount }} instructor record{{ staleCount === 1 ? ' is' : 's are' }} based on a
        logbook that has not been checked in the last 48 hours. The last available values are still
        shown below.
      </div>

      <div
        v-for="warning in overview.warnings"
        :key="`${warning.profile_id}-${warning.message}`"
        class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        {{ warning.message }}
      </div>

      <div
        v-if="downloadError"
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800"
      >
        <p>{{ downloadError }}</p>
        <button type="button" class="text-sm font-medium underline" @click="downloadError = null">
          Dismiss
        </button>
      </div>

      <div
        v-if="!overview.instructors.length"
        class="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500"
      >
        No FI, BI, or IFP members with a connected logbook were found for this club.
      </div>
      <ClubInstructorsTable
        v-else
        :instructors="overview.instructors"
        :downloading-profile-id="downloadingProfileId"
        @download="downloadReport"
      />
    </template>
  </div>
</template>
