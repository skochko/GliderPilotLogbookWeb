<script setup lang="ts">
import { ref } from 'vue'
import type { DeepReadonly } from 'vue'
import { formatRequirementProgress } from '@/lib/requirementProgress'
import {
  dashboardChipBaseClass,
  dashboardChipStatusDotStyles,
  dashboardChipStatusStyles,
} from '@/lib/dashboardChips'
import type { DashboardLegalityChip, DashboardLegalityGroup, DashboardLegalityRow, DashboardRequirement, DashboardStatusEnum } from '@/types'

defineProps<{
  groups: DeepReadonly<DashboardLegalityGroup[]>
}>()

const expandedItemId = ref<string | null>(null)

const statusDotStyles = dashboardChipStatusDotStyles
const chipStyles = dashboardChipStatusStyles

function itemKey(groupId: string, itemId: string): string {
  return `${groupId}:${itemId}`
}

function toggleItem(groupId: string, itemId: string): void {
  const key = itemKey(groupId, itemId)
  expandedItemId.value = expandedItemId.value === key ? null : key
}

function isExpanded(groupId: string, itemId: string): boolean {
  return expandedItemId.value === itemKey(groupId, itemId)
}

function requirementProgress(
  requirement: Pick<
    DashboardRequirement,
    'id' | 'obtained' | 'required' | 'requirement_type' | 'lookback_period' | 'status'
  >,
): string {
  return formatRequirementProgress(requirement)
}

function rowProgress(row: DeepReadonly<DashboardLegalityRow | DashboardLegalityChip>): string {
  if (row.obtained || row.required) {
    return formatRequirementProgress({
      id: row.id,
      obtained: row.obtained,
      required: row.required,
      requirement_type: row.requirement_type,
      lookback_period: row.lookback_period,
      status: row.status,
    })
  }
  const failing = row.requirements.find((item) => item.status !== 'current')
  if (!failing) {
    return ''
  }
  return requirementProgress(failing)
}

function statusLabel(status: DashboardStatusEnum): string {
  if (status === 'current') return 'Current'
  if (status === 'expiring_soon') return 'Expiring soon'
  if (status === 'expired') return 'Not current'
  return 'Unknown'
}
</script>

<template>
  <div class="space-y-4">
    <section v-for="group in groups" :key="group.id">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {{ group.title }}
      </h3>

      <div class="mt-2 space-y-2">
        <div v-for="row in group.rows" :key="row.id">
          <button
            type="button"
            class="flex w-full items-start gap-3 text-left"
            @click="toggleItem(group.id, row.id)"
          >
            <span
              class="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              :class="statusDotStyles[row.status]"
              :title="statusLabel(row.status)"
              role="img"
              :aria-label="statusLabel(row.status)"
            />
            <span class="min-w-0 flex-1">
              <span class="block text-sm text-slate-900">{{ row.label }}</span>
              <span v-if="rowProgress(row)" class="mt-0.5 block text-xs tabular-nums text-slate-500">
                {{ rowProgress(row) }}
              </span>
            </span>
          </button>

          <div
            v-if="isExpanded(group.id, row.id)"
            class="ml-5 mt-2 space-y-2 border-l border-slate-200 pl-3"
          >
            <div
              v-for="requirement in row.requirements"
              :key="requirement.id"
              class="flex items-start gap-3"
            >
              <span
                class="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                :class="statusDotStyles[requirement.status]"
                :title="statusLabel(requirement.status)"
                role="img"
                :aria-label="statusLabel(requirement.status)"
              />
              <div class="min-w-0 flex-1 text-xs text-slate-600">
                <p class="font-medium text-slate-800">{{ requirement.label || requirement.title }}</p>
                <p v-if="requirementProgress(requirement)" class="mt-0.5 tabular-nums text-slate-500">
                  {{ requirementProgress(requirement) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="group.chips.length" class="mt-3">
        <p v-if="group.chip_section_title" class="text-xs font-medium text-slate-500">
          {{ group.chip_section_title }}
        </p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="chip in group.chips"
            :key="chip.id"
            type="button"
            :class="[dashboardChipBaseClass, chipStyles[chip.status]]"
            @click="toggleItem(group.id, chip.id)"
          >
            <span
              class="h-1.5 w-1.5 shrink-0 rounded-full"
              :class="statusDotStyles[chip.status]"
            />
            {{ chip.label }}
          </button>
        </div>

        <div
          v-for="chip in group.chips"
          :key="`${chip.id}-details`"
        >
          <div
            v-if="isExpanded(group.id, chip.id)"
            class="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <div class="flex items-start gap-3">
              <span
                class="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                :class="statusDotStyles[chip.status]"
                :title="statusLabel(chip.status)"
                role="img"
                :aria-label="statusLabel(chip.status)"
              />
              <div class="min-w-0 flex-1 text-xs text-slate-600">
                <p class="font-medium text-slate-800">{{ chip.label }}</p>
                <p v-if="requirementProgress(chip)" class="mt-0.5 tabular-nums text-slate-500">
                  {{ requirementProgress(chip) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
