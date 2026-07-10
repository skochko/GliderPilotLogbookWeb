<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DeepReadonly } from 'vue'
import {
  axisTicks,
  buildYearChartSeries,
  defaultChartYear,
  formatChartHours,
  formatMonthShortLabel,
  listAvailableChartYears,
  niceAxisMax,
  type MonthlyFlightStats,
} from '@/lib/monthlyChart'

const props = defineProps<{
  data: DeepReadonly<MonthlyFlightStats[]>
}>()

const CHART_WIDTH = 560
const CHART_HEIGHT = 228
const MARGIN = { top: 8, right: 40, bottom: 30, left: 40 }
const INNER_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right
const INNER_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom

const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref<string | null>(null)

const availableYears = computed(() => listAvailableChartYears(props.data))
const showYearSelector = computed(() => availableYears.value.length > 1)
const series = computed(() => buildYearChartSeries(props.data, selectedYear.value))

watch(
  availableYears,
  (years) => {
    if (!years.includes(selectedYear.value)) {
      selectedYear.value = defaultChartYear(years)
    }
  },
  { immediate: true },
)

watch(selectedYear, () => {
  selectedMonth.value = null
})

const maxHours = computed(() => niceAxisMax(Math.max(...series.value.map((item) => item.hours), 0)))
const maxCount = computed(() => niceAxisMax(Math.max(...series.value.map((item) => item.count), 0)))

const hourTicks = computed(() => axisTicks(maxHours.value))
const countTicks = computed(() => axisTicks(maxCount.value))

const bars = computed(() => {
  const count = series.value.length || 1
  const groupWidth = INNER_WIDTH / count
  const barWidth = Math.min(22, groupWidth * 0.42)
  const barGap = 2

  return series.value.map((item, index) => {
    const centerX = MARGIN.left + groupWidth * index + groupWidth / 2
    const hoursHeight = maxHours.value ? (item.hours / maxHours.value) * INNER_HEIGHT : 0
    const countHeight = maxCount.value ? (item.count / maxCount.value) * INNER_HEIGHT : 0
    const baselineY = MARGIN.top + INNER_HEIGHT

    return {
      month: item.month,
      label: formatMonthShortLabel(item.month),
      count: item.count,
      hoursLabel: formatChartHours(item.hours),
      hitArea: {
        x: MARGIN.left + groupWidth * index,
        y: MARGIN.top,
        width: groupWidth,
        height: CHART_HEIGHT - MARGIN.top,
      },
      hoursBar: {
        x: centerX - barGap / 2 - barWidth,
        y: baselineY - hoursHeight,
        width: barWidth,
        height: hoursHeight,
      },
      countBar: {
        x: centerX + barGap / 2,
        y: baselineY - countHeight,
        width: barWidth,
        height: countHeight,
      },
      labelX: centerX,
    }
  })
})

const hasActivity = computed(() => props.data.some((item) => item.count > 0 || item.hours > 0))

const selectedBar = computed(() => {
  if (!selectedMonth.value) {
    return null
  }
  const bar = bars.value.find((item) => item.month === selectedMonth.value)
  if (!bar) {
    return null
  }
  return bar
})

function selectYear(year: number): void {
  selectedYear.value = year
}

function toggleMonth(month: string): void {
  selectedMonth.value = selectedMonth.value === month ? null : month
}

function formatFlightCount(count: number): string {
  return count === 1 ? '1 flight' : `${count} flights`
}

function isCurrentCalendarYear(year: number): boolean {
  return year === new Date().getFullYear()
}
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="font-semibold text-slate-900">Activity by month</h2>
      <div class="flex items-center gap-3 text-xs text-slate-500">
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-sm bg-sky-500" aria-hidden="true" />
          Hours
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-sm bg-emerald-500" aria-hidden="true" />
          Flights
        </span>
      </div>
    </div>

    <p v-if="!hasActivity" class="mt-4 text-sm text-slate-500">No flights recorded yet.</p>

    <template v-else>
      <svg
        class="mt-3 w-full overflow-visible"
        :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
        role="img"
        :aria-label="`Monthly flight hours and flight count chart for ${selectedYear}`"
      >
        <line
          :x1="MARGIN.left"
          :y1="MARGIN.top"
          :x2="MARGIN.left"
          :y2="MARGIN.top + INNER_HEIGHT"
          class="stroke-slate-300"
          stroke-width="1"
        />
        <line
          :x1="MARGIN.left + INNER_WIDTH"
          :y1="MARGIN.top"
          :x2="MARGIN.left + INNER_WIDTH"
          :y2="MARGIN.top + INNER_HEIGHT"
          class="stroke-slate-300"
          stroke-width="1"
        />
        <line
          :x1="MARGIN.left"
          :y1="MARGIN.top + INNER_HEIGHT"
          :x2="MARGIN.left + INNER_WIDTH"
          :y2="MARGIN.top + INNER_HEIGHT"
          class="stroke-slate-300"
          stroke-width="1"
        />

        <g v-for="tick in hourTicks" :key="`hours-${tick}`">
          <line
            :x1="MARGIN.left - 4"
            :y1="MARGIN.top + INNER_HEIGHT - (tick / maxHours) * INNER_HEIGHT"
            :x2="MARGIN.left"
            :y2="MARGIN.top + INNER_HEIGHT - (tick / maxHours) * INNER_HEIGHT"
            class="stroke-slate-300"
            stroke-width="1"
          />
          <text
            :x="MARGIN.left - 8"
            :y="MARGIN.top + INNER_HEIGHT - (tick / maxHours) * INNER_HEIGHT + 4"
            text-anchor="end"
            font-size="14"
            class="fill-slate-500"
          >
            {{ formatChartHours(tick) }}
          </text>
        </g>

        <g v-for="tick in countTicks" :key="`count-${tick}`">
          <line
            :x1="MARGIN.left + INNER_WIDTH"
            :y1="MARGIN.top + INNER_HEIGHT - (tick / maxCount) * INNER_HEIGHT"
            :x2="MARGIN.left + INNER_WIDTH + 4"
            :y2="MARGIN.top + INNER_HEIGHT - (tick / maxCount) * INNER_HEIGHT"
            class="stroke-slate-300"
            stroke-width="1"
          />
          <text
            :x="MARGIN.left + INNER_WIDTH + 8"
            :y="MARGIN.top + INNER_HEIGHT - (tick / maxCount) * INNER_HEIGHT + 4"
            text-anchor="start"
            font-size="14"
            class="fill-slate-500"
          >
            {{ tick }}
          </text>
        </g>

        <g
          v-for="bar in bars"
          :key="bar.month"
          class="cursor-pointer"
          role="button"
          tabindex="0"
          :aria-pressed="selectedMonth === bar.month"
          :aria-label="`${bar.label}: ${formatFlightCount(bar.count)}, ${bar.hoursLabel}`"
          @click="toggleMonth(bar.month)"
          @keydown.enter.prevent="toggleMonth(bar.month)"
          @keydown.space.prevent="toggleMonth(bar.month)"
        >
          <rect
            :x="bar.hitArea.x"
            :y="bar.hitArea.y"
            :width="bar.hitArea.width"
            :height="bar.hitArea.height"
            fill="transparent"
          />
          <rect
            :x="bar.hoursBar.x"
            :y="bar.hoursBar.y"
            :width="bar.hoursBar.width"
            :height="bar.hoursBar.height"
            :class="selectedMonth === bar.month ? 'fill-sky-600' : 'fill-sky-500'"
            rx="2"
          />
          <rect
            :x="bar.countBar.x"
            :y="bar.countBar.y"
            :width="bar.countBar.width"
            :height="bar.countBar.height"
            :class="selectedMonth === bar.month ? 'fill-emerald-600' : 'fill-emerald-500'"
            rx="2"
          />
          <text
            :x="bar.labelX"
            :y="CHART_HEIGHT - 10"
            text-anchor="middle"
            font-size="17"
            :font-weight="selectedMonth === bar.month ? 600 : 500"
            :class="selectedMonth === bar.month ? 'fill-slate-900' : 'fill-slate-700'"
          >
            {{ bar.label }}
          </text>
        </g>
      </svg>

      <p
        v-if="selectedBar"
        class="mt-2 text-center text-sm text-slate-700"
        aria-live="polite"
      >
        <span class="font-medium">{{ selectedBar.label }} {{ selectedYear }}</span>
        <span class="mx-2 text-slate-300" aria-hidden="true">·</span>
        <span class="text-emerald-700">{{ formatFlightCount(selectedBar.count) }}</span>
        <span class="mx-2 text-slate-300" aria-hidden="true">·</span>
        <span class="text-sky-700">{{ selectedBar.hoursLabel }}</span>
      </p>

      <div v-if="showYearSelector" class="mt-3 flex flex-wrap justify-center gap-2">
        <button
          v-for="year in availableYears"
          :key="year"
          type="button"
          class="rounded-full px-3 py-1 text-sm font-medium transition"
          :class="
            year === selectedYear
              ? 'bg-sky-100 text-sky-900 ring-1 ring-inset ring-sky-200'
              : 'text-slate-600 hover:bg-slate-100'
          "
          :aria-pressed="year === selectedYear"
          @click="selectYear(year)"
        >
          {{ year }}
          <span v-if="isCurrentCalendarYear(year) && year !== selectedYear" class="sr-only">
            (current year)
          </span>
        </button>
      </div>
    </template>
  </section>
</template>
