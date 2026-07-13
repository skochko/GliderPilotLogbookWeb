<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DeepReadonly } from 'vue'
import { formatDecimalHours } from '@/lib/duration'
import {
  buildFlyingTotalsRows,
  FLYING_TOTALS_BADGE_CLASS,
  FLYING_TOTALS_LABEL_CLASS,
  FLYING_TOTALS_ROW_CLASS,
  flyingBreakdownRows,
  flyingSummaryRows,
  rowCountClass,
  rowHoursClass,
} from '@/lib/flyingTotalsRows'
import type { Statistics } from '@/types'

const props = defineProps<{
  statistics: DeepReadonly<Statistics>
  alwaysExpanded?: boolean
}>()

const expanded = ref(false)

const rows = computed(() => buildFlyingTotalsRows(props.statistics))
const summaryRows = computed(() => flyingSummaryRows(rows.value))
const breakdownRows = computed(() => flyingBreakdownRows(rows.value))
const showBreakdown = computed(() => props.alwaysExpanded || expanded.value)

function toggleExpanded(): void {
  if (props.alwaysExpanded) {
    return
  }
  expanded.value = !expanded.value
}
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:p-4">
    <h2 class="text-sm font-medium text-slate-500">Your flying</h2>

    <div
      :role="alwaysExpanded ? undefined : 'button'"
      :tabindex="alwaysExpanded ? undefined : 0"
      class="mt-2 w-full text-left"
      :class="alwaysExpanded ? '' : 'cursor-pointer rounded-md transition hover:bg-slate-50'"
      @click="toggleExpanded"
      @keydown.enter.prevent="toggleExpanded"
      @keydown.space.prevent="toggleExpanded"
    >
      <div class="space-y-2">
        <div
          v-for="row in summaryRows"
          :key="row.key"
          :class="FLYING_TOTALS_ROW_CLASS"
        >
          <div :class="FLYING_TOTALS_LABEL_CLASS">
            <span
              v-if="row.badgeClass"
              :class="[FLYING_TOTALS_BADGE_CLASS, row.badgeClass]"
            >
              {{ row.label }}
            </span>
            <span v-else class="text-sm font-medium text-slate-700">{{ row.label }}</span>
          </div>
          <span class="text-right">
            <span class="block tabular-nums text-slate-900" :class="rowHoursClass(row.key)">
              {{ formatDecimalHours(row.hours) }}
            </span>
            <span class="block text-slate-500" :class="rowCountClass(row.key)">
              {{ row.count }} {{ row.countLabel }}
            </span>
          </span>
        </div>
      </div>
    </div>

    <dl
      v-show="showBreakdown"
      id="flying-breakdown"
      class="mt-1 pt-1"
    >
      <div
        v-for="row in breakdownRows"
        :key="row.key"
        :class="[FLYING_TOTALS_ROW_CLASS, 'py-1']"
      >
        <dt :class="FLYING_TOTALS_LABEL_CLASS">
          <span
            v-if="row.badgeClass"
            :class="[FLYING_TOTALS_BADGE_CLASS, row.badgeClass]"
          >
            {{ row.label }}
          </span>
        </dt>
        <dd class="text-right">
          <p class="tabular-nums text-slate-900" :class="rowHoursClass(row.key)">
            {{ formatDecimalHours(row.hours) }}
          </p>
          <p v-if="row.countLabel" class="text-slate-500" :class="rowCountClass(row.key)">
            {{ row.count }} {{ row.countLabel }}
          </p>
        </dd>
      </div>
    </dl>

    <component
      :is="alwaysExpanded ? 'div' : 'button'"
      :type="alwaysExpanded ? undefined : 'button'"
      class="mt-2 flex w-full items-center justify-between gap-4 border-t border-slate-100 pt-2 text-left"
      :aria-expanded="alwaysExpanded ? undefined : expanded"
      aria-controls="flying-breakdown"
      @click="toggleExpanded"
    >
      <div class="flex min-w-0 flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
        <span>{{ statistics.days_flown }} {{ statistics.days_flown === 1 ? 'day' : 'days' }} flown</span>
        <span>Avg flight {{ formatDecimalHours(statistics.avg_flight_hours) }}</span>
      </div>
      <svg
        v-if="!alwaysExpanded"
        class="h-4 w-4 shrink-0 text-slate-400 transition-transform"
        :class="expanded ? 'rotate-180' : ''"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </component>
  </section>
</template>
