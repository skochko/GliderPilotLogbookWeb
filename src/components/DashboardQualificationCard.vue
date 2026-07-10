<script setup lang="ts">
import { computed } from 'vue'
import type { DeepReadonly } from 'vue'
import { formatRequirementProgress } from '@/lib/requirementProgress'
import { formatRequirementValue } from '@/lib/duration'
import type { DashboardQualification, DashboardRequirement, DashboardStatusEnum } from '@/types'

const props = defineProps<{
  qualification: DeepReadonly<DashboardQualification>
  expanded: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const statusStyles: Record<DashboardStatusEnum, string> = {
  current: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  expiring_soon: 'bg-amber-100 text-amber-900 ring-amber-200',
  expired: 'bg-red-100 text-red-800 ring-red-200',
  unknown: 'bg-slate-100 text-slate-700 ring-slate-200',
}

const statusDotStyles: Record<DashboardStatusEnum, string> = {
  current: 'bg-emerald-500',
  expiring_soon: 'bg-amber-500',
  expired: 'bg-red-500',
  unknown: 'bg-slate-400',
}

const summaryRequirementIds = computed(
  () => new Set((props.qualification.summary_items ?? []).map((item) => item.id)),
)

const primaryRequirements = computed(() => {
  const { requirements, summary_items } = props.qualification
  if (summary_items?.length) {
    return requirements.filter((requirement) => summaryRequirementIds.value.has(requirement.id))
  }
  return requirements
})

const additionalRequirements = computed(() => {
  if (!props.qualification.summary_items?.length) {
    return []
  }
  return props.qualification.requirements.filter(
    (requirement) => !summaryRequirementIds.value.has(requirement.id),
  )
})

const hasAdditional = computed(() => additionalRequirements.value.length > 0)

const visibleRequirements = computed(() => {
  if (props.expanded) {
    return [...primaryRequirements.value, ...additionalRequirements.value]
  }
  return primaryRequirements.value
})

function statusLabel(status: DashboardStatusEnum): string {
  if (status === 'current') return 'Current'
  if (status === 'expiring_soon') return 'Expiring soon'
  if (status === 'expired') return 'Not current'
  return 'Unknown'
}

function requirementProgress(requirement: DeepReadonly<DashboardRequirement>): string {
  return formatRequirementProgress(requirement)
}

function requirementLabel(requirement: DashboardRequirement): string {
  return requirement.label?.trim() || requirement.title
}

function handleToggle(): void {
  if (hasAdditional.value) {
    emit('toggle')
  }
}
</script>

<template>
  <article
    class="border-t border-slate-200 pt-3 first:border-t-0 first:pt-0 md:rounded-lg md:border md:border-slate-200 md:bg-slate-50/60 md:pt-0"
  >
    <button
      type="button"
      class="flex w-full items-start gap-3 px-3 pt-3 pb-1 text-left md:cursor-default md:px-4 md:pt-4 md:pb-2"
      :class="hasAdditional ? 'cursor-pointer' : ''"
      :aria-expanded="hasAdditional ? expanded : undefined"
      @click="handleToggle"
    >
      <div class="min-w-0 flex-1">
        <h3 class="font-medium text-slate-900">
          {{ qualification.title }}
          <span class="font-normal text-slate-500"> · </span>
          <span class="font-normal text-slate-600">{{ qualification.regulation }}</span>
        </h3>
      </div>
      <svg
        v-if="hasAdditional"
        class="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform md:hidden"
        :class="expanded ? 'rotate-180' : ''"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div class="px-3 pb-3 pt-1 md:hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <tbody>
            <tr
              v-for="requirement in visibleRequirements"
              :key="requirement.id"
              class="border-t border-slate-200 first:border-t-0"
            >
              <td class="py-2.5 pr-3 align-top">
                <p class="text-slate-900">{{ requirementLabel(requirement) }}</p>
                <p class="mt-0.5 text-xs tabular-nums text-slate-500">
                  {{ requirementProgress(requirement) }}
                </p>
              </td>
              <td class="w-7 py-2.5 align-top text-right">
                <span
                  class="inline-block h-2.5 w-2.5 rounded-full"
                  :class="statusDotStyles[requirement.status]"
                  :title="statusLabel(requirement.status)"
                  role="img"
                  :aria-label="statusLabel(requirement.status)"
                />
              </td>
            </tr>
            <tr v-if="!visibleRequirements.length">
              <td colspan="2" class="py-2.5 text-slate-500">
                No requirements configured for this qualification yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="hidden px-4 pb-4 md:block">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left text-slate-500">
              <th class="pb-2 pr-4 font-medium">Requirement</th>
              <th class="pb-2 pr-4 font-medium">Obtained</th>
              <th class="pb-2 pr-4 font-medium">Required</th>
              <th class="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="requirement in qualification.requirements"
              :key="requirement.id"
              class="border-t border-slate-200"
            >
              <td class="py-2 pr-4 text-slate-900">{{ requirement.title }}</td>
              <td class="py-2 pr-4 text-slate-700">
                {{ formatRequirementValue(requirement.obtained) }}
              </td>
              <td class="py-2 pr-4 text-slate-700">
                {{ formatRequirementValue(requirement.required) }}
              </td>
              <td class="py-2">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
                  :class="statusStyles[requirement.status]"
                >
                  {{ statusLabel(requirement.status) }}
                </span>
              </td>
            </tr>
            <tr v-if="!qualification.requirements.length">
              <td colspan="4" class="py-3 text-slate-500">
                No requirements configured for this qualification yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </article>
</template>
