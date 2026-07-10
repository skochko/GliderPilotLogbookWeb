<script setup lang="ts">
import { ref } from 'vue'
import type { DeepReadonly } from 'vue'
import DashboardLegalityGroups from '@/components/DashboardLegalityGroups.vue'
import DashboardMedicalCard from '@/components/DashboardMedicalCard.vue'
import type { DashboardStatus } from '@/types'

defineProps<{
  status: DeepReadonly<DashboardStatus>
}>()

const medicalExpanded = ref(false)
</script>

<template>
  <section class="space-y-4 md:space-y-5">
    <DashboardMedicalCard
      v-if="status.medical[0]"
      v-model:expanded="medicalExpanded"
      :medical="status.medical[0]"
    />
    <article
      v-else
      class="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm md:px-5 md:py-4"
    >
      <h2 class="font-semibold text-slate-900">Medical</h2>
      <p class="mt-2 text-sm text-slate-500">No medical entries recorded in the logbook yet.</p>
    </article>

    <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 px-4 py-2.5 md:px-5 md:py-3">
        <h2 class="font-semibold text-slate-900">Legality</h2>
        <p class="mt-0.5 hidden text-sm text-slate-500 md:block">
          Qualifications and recency requirements from your logbook.
        </p>
      </div>

      <div class="px-4 py-3 md:px-5 md:py-5">
        <DashboardLegalityGroups
          v-if="status.legality_groups?.length"
          :groups="status.legality_groups"
        />
        <p v-else class="text-sm text-slate-500">
          No qualification data configured in the logbook yet.
        </p>
      </div>
    </section>
  </section>
</template>
