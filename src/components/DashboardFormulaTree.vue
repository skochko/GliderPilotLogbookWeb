<script setup lang="ts">
import { computed } from 'vue'
import type { DeepReadonly } from 'vue'
import { formatRequirementProgress } from '@/lib/requirementProgress'
import { dashboardChipStatusDotStyles } from '@/lib/dashboardChips'
import type { DashboardFormulaNode, DashboardRequirement, DashboardStatusEnum } from '@/types'

const props = defineProps<{
  node: DeepReadonly<DashboardFormulaNode>
  requirements: DeepReadonly<DashboardRequirement[]>
}>()

const requirement = computed(() => {
  const node = props.node
  return 'requirement_id' in node
    ? props.requirements.find((item) => item.id === node.requirement_id)
    : undefined
})

function statusLabel(status: DashboardStatusEnum): string {
  if (status === 'current') return 'Current'
  if (status === 'expiring_soon') return 'Expiring soon'
  if (status === 'expired') return 'Not current'
  return 'Unknown'
}
</script>

<template>
  <div v-if="'operator' in node" class="border-l border-slate-200 pl-3">
    <template v-for="(child, index) in node.children" :key="index">
      <div v-if="index > 0" class="my-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        <span v-if="node.operator === 'AND'" class="h-px flex-1 bg-slate-200" />
        <span>{{ node.operator }}</span>
        <span v-if="node.operator === 'AND'" class="h-px flex-1 bg-slate-200" />
      </div>
      <DashboardFormulaTree :node="child" :requirements="requirements" />
    </template>
  </div>
  <div v-else-if="requirement" class="flex items-start gap-3 py-0.5">
    <span
      class="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
      :class="dashboardChipStatusDotStyles[requirement.status]"
      :title="statusLabel(requirement.status)"
      role="img"
      :aria-label="statusLabel(requirement.status)"
    />
    <div class="min-w-0 flex-1 text-xs text-slate-600">
      <p class="font-medium text-slate-800">{{ requirement.label || requirement.title }}</p>
      <p v-if="formatRequirementProgress(requirement)" class="mt-0.5 tabular-nums text-slate-500">
        {{ formatRequirementProgress(requirement) }}
      </p>
    </div>
  </div>
</template>
