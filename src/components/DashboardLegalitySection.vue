<script setup lang="ts">
import type { DeepReadonly } from 'vue'
import DashboardLegalityGroups from '@/components/DashboardLegalityGroups.vue'
import DashboardPilotOverviewCard from '@/components/DashboardPilotOverviewCard.vue'
import type { DashboardStatus, Flight } from '@/types'

const props = defineProps<{
  status: DeepReadonly<DashboardStatus>
  pilotName: string
  lastFlight: Flight | null
  pilotPrivilegeNotice?: string
}>()

</script>

<template>
  <section class="space-y-4 md:space-y-5">
    <DashboardPilotOverviewCard
      :pilot-name="props.pilotName"
      :pilot-privilege="status.pilot_privilege"
      :last-flight="props.lastFlight"
      :medical="status.medical[0] ?? null"
    />

    <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 px-4 py-2.5 md:px-5 md:py-3">
        <h2 class="font-semibold text-slate-900">Legality</h2>
        <p v-if="status.legality_groups?.length" class="mt-0.5 text-sm text-slate-500">
          Click an item for more information.
        </p>
      </div>

      <div class="px-4 py-3 md:px-5 md:py-5">
        <p
          v-if="props.pilotPrivilegeNotice"
          class="mb-4 text-sm text-slate-700"
          role="alert"
        >
          {{ props.pilotPrivilegeNotice }}
        </p>
        <DashboardLegalityGroups
          v-if="status.legality_groups?.length"
          :groups="status.legality_groups"
        />
        <p v-else-if="!props.pilotPrivilegeNotice" class="text-sm text-slate-500">
          No qualification data configured in the logbook yet.
        </p>
      </div>
    </section>
  </section>
</template>
