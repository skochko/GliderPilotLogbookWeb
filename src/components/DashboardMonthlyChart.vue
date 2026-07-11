<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { DeepReadonly } from 'vue'
import {
  axisTicks,
  buildWeeklyChartSeries,
  buildYearChartSeries,
  chartPeriodLabel,
  CHART_PERIOD_OPTIONS,
  defaultChartYear,
  defaultWeekAnchorForYear,
  formatChartHours,
  formatMonthShortLabel,
  formatWeekDetailLabel,
  formatWeekShortLabel,
  formatWeekWindowChipLabel,
  listAvailableChartYearsCombined,
  niceAxisMax,
  weekAnchorsForYear,
  weekCountForPeriod,
  type ChartPeriodMode,
  type ChartPeriodStats,
  type MonthlyFlightStats,
  type WeeklyFlightStats,
} from '@/lib/monthlyChart'

const props = defineProps<{
  monthlyData: DeepReadonly<MonthlyFlightStats[]>
  weeklyData: DeepReadonly<WeeklyFlightStats[]>
}>()

const CHART_WIDTH = 560
const CHART_HEIGHT = 228
const MARGIN = { top: 8, right: 40, bottom: 30, left: 40 }
const INNER_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right
const INNER_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom

const periodMode = ref<ChartPeriodMode>('month')
const periodMenuOpen = ref(false)
const periodMenuRef = ref<HTMLElement | null>(null)
const selectedYear = ref(new Date().getFullYear())
const selectedKey = ref<string | null>(null)
const selectedWeekEnd = ref('')
const weekAnchorStripRef = ref<HTMLElement | null>(null)

const availableYears = computed(() =>
  listAvailableChartYearsCombined(props.monthlyData, props.weeklyData),
)
const showYearRow = computed(() => availableYears.value.length > 0)
const isWeekMode = computed(() => periodMode.value !== 'month')
const weekCount = computed(() => weekCountForPeriod(periodMode.value))

const weekAnchorKeys = computed(() => weekAnchorsForYear(props.weeklyData, selectedYear.value))

const weekAnchorOptions = computed(() =>
  weekAnchorKeys.value.map((weekKey) => ({
    key: weekKey,
    label: formatWeekWindowChipLabel(weekKey, weekCount.value),
  })),
)

const series = computed((): ChartPeriodStats[] => {
  if (periodMode.value === 'month') {
    return buildYearChartSeries(props.monthlyData, selectedYear.value)
  }
  return buildWeeklyChartSeries(
    props.weeklyData,
    weekCount.value,
    selectedWeekEnd.value || undefined,
  )
})

watch(
  availableYears,
  (years) => {
    if (!years.includes(selectedYear.value)) {
      selectedYear.value = defaultChartYear(years)
    }
  },
  { immediate: true },
)

watch([periodMode, selectedYear], () => {
  selectedKey.value = null
})

watch(periodMode, (mode) => {
  if (mode !== 'month') {
    selectedWeekEnd.value = defaultWeekAnchorForYear(props.weeklyData, selectedYear.value)
  }
})

watch([weekAnchorKeys, periodMode], () => {
  if (periodMode.value === 'month') {
    return
  }
  if (!weekAnchorKeys.value.length) {
    selectedWeekEnd.value = defaultWeekAnchorForYear(props.weeklyData, selectedYear.value)
    return
  }
  if (!weekAnchorKeys.value.includes(selectedWeekEnd.value)) {
    selectedWeekEnd.value = weekAnchorKeys.value[weekAnchorKeys.value.length - 1]!
  }
})

watch(selectedWeekEnd, () => {
  void scrollSelectedWeekAnchorIntoView()
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
      key: item.key,
      label:
        periodMode.value === 'month'
          ? formatMonthShortLabel(item.key)
          : formatWeekShortLabel(item.key),
      detailLabel:
        periodMode.value === 'month'
          ? `${formatMonthShortLabel(item.key)} ${selectedYear.value}`
          : formatWeekDetailLabel(item.key),
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

const hasActivity = computed(() =>
  props.monthlyData.some((item) => item.count > 0 || item.hours > 0)
  || props.weeklyData.some((item) => item.count > 0 || item.hours > 0),
)

const selectedBar = computed(() => {
  if (!selectedKey.value) {
    return null
  }
  return bars.value.find((item) => item.key === selectedKey.value) ?? null
})

const chartAriaLabel = computed(() => {
  if (periodMode.value === 'month') {
    return `Monthly flight hours and flight count chart for ${selectedYear.value}`
  }
  return `Weekly flight hours and flight count chart for the last ${chartPeriodLabel(periodMode.value)}`
})

function selectYear(year: number): void {
  selectedYear.value = year
  if (periodMode.value !== 'month') {
    selectedWeekEnd.value = defaultWeekAnchorForYear(props.weeklyData, year)
  }
}

function selectWeekAnchor(weekKey: string): void {
  selectedWeekEnd.value = weekKey
  selectedKey.value = null
}

async function scrollSelectedWeekAnchorIntoView(): Promise<void> {
  await nextTick()
  const strip = weekAnchorStripRef.value
  if (!strip) {
    return
  }
  const selected = strip.querySelector<HTMLElement>('[data-week-anchor-selected="true"]')
  selected?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
}

function toggleKey(key: string): void {
  selectedKey.value = selectedKey.value === key ? null : key
}

function selectPeriod(mode: ChartPeriodMode): void {
  periodMode.value = mode
  periodMenuOpen.value = false
  if (mode !== 'month') {
    selectedWeekEnd.value = defaultWeekAnchorForYear(props.weeklyData, selectedYear.value)
  }
}

function formatFlightCount(count: number): string {
  return count === 1 ? '1 flight' : `${count} flights`
}

function isCurrentCalendarYear(year: number): boolean {
  return year === new Date().getFullYear()
}

function handleDocumentClick(event: MouseEvent): void {
  if (!periodMenuOpen.value || !periodMenuRef.value) {
    return
  }
  const target = event.target
  if (target instanceof Node && !periodMenuRef.value.contains(target)) {
    periodMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="flex items-center gap-1 font-semibold text-slate-900">
        <span>Activity by</span>
        <span ref="periodMenuRef" class="relative inline-flex">
          <button
            type="button"
            class="inline-flex items-center gap-0.5 rounded font-semibold text-slate-900 transition hover:text-slate-700"
            :aria-expanded="periodMenuOpen"
            aria-haspopup="listbox"
            @click.stop="periodMenuOpen = !periodMenuOpen"
          >
            {{ chartPeriodLabel(periodMode) }}
            <svg
              class="h-4 w-4 shrink-0 text-slate-500 transition-transform"
              :class="periodMenuOpen ? 'rotate-180' : ''"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            v-if="periodMenuOpen"
            class="absolute left-0 top-full z-10 mt-1 min-w-[8.5rem] rounded-md border border-slate-200 bg-white py-1 shadow-lg"
            role="listbox"
            :aria-label="'Activity period'"
          >
            <button
              v-for="option in CHART_PERIOD_OPTIONS"
              :key="option.value"
              type="button"
              role="option"
              class="block w-full px-3 py-1.5 text-left text-sm transition hover:bg-slate-50"
              :class="option.value === periodMode ? 'bg-sky-50 font-medium text-sky-900' : 'text-slate-700'"
              :aria-selected="option.value === periodMode"
              @click="selectPeriod(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </span>
      </h2>
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
        :aria-label="chartAriaLabel"
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
          :key="bar.key"
          class="cursor-pointer"
          role="button"
          tabindex="0"
          :aria-pressed="selectedKey === bar.key"
          :aria-label="`${bar.label}: ${formatFlightCount(bar.count)}, ${bar.hoursLabel}`"
          @click="toggleKey(bar.key)"
          @keydown.enter.prevent="toggleKey(bar.key)"
          @keydown.space.prevent="toggleKey(bar.key)"
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
            :class="selectedKey === bar.key ? 'fill-sky-600' : 'fill-sky-500'"
            rx="2"
          />
          <rect
            :x="bar.countBar.x"
            :y="bar.countBar.y"
            :width="bar.countBar.width"
            :height="bar.countBar.height"
            :class="selectedKey === bar.key ? 'fill-emerald-600' : 'fill-emerald-500'"
            rx="2"
          />
          <text
            :x="bar.labelX"
            :y="CHART_HEIGHT - 10"
            text-anchor="middle"
            font-size="17"
            :font-weight="selectedKey === bar.key ? 600 : 500"
            :class="selectedKey === bar.key ? 'fill-slate-900' : 'fill-slate-700'"
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
        <span class="font-medium">{{ selectedBar.detailLabel }}</span>
        <span class="mx-2 text-slate-300" aria-hidden="true">·</span>
        <span class="text-emerald-700">{{ formatFlightCount(selectedBar.count) }}</span>
        <span class="mx-2 text-slate-300" aria-hidden="true">·</span>
        <span class="text-sky-700">{{ selectedBar.hoursLabel }}</span>
      </p>

      <div v-if="showYearRow" class="mt-3 space-y-2">
        <div class="-mx-1 overflow-x-auto px-1 [scrollbar-width:thin]">
          <div class="flex w-max min-w-full justify-center gap-2">
            <button
              v-for="year in availableYears"
              :key="year"
              type="button"
              class="shrink-0 rounded-full px-3 py-1 text-sm font-medium transition"
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
        </div>

        <div
          v-if="isWeekMode && weekAnchorOptions.length"
          ref="weekAnchorStripRef"
          class="-mx-1 overflow-x-auto px-1 [scrollbar-width:thin]"
        >
          <div class="flex w-max gap-2">
            <button
              v-for="anchor in weekAnchorOptions"
              :key="anchor.key"
              type="button"
              class="shrink-0 rounded-full px-3 py-1 text-sm font-medium transition"
              :class="
                anchor.key === selectedWeekEnd
                  ? 'bg-sky-100 text-sky-900 ring-1 ring-inset ring-sky-200'
                  : 'text-slate-600 hover:bg-slate-100'
              "
              :aria-pressed="anchor.key === selectedWeekEnd"
              :data-week-anchor-selected="anchor.key === selectedWeekEnd ? 'true' : undefined"
              @click="selectWeekAnchor(anchor.key)"
            >
              {{ anchor.label }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
