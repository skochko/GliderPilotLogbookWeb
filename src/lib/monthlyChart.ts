export interface MonthlyFlightStats {
  month: string
  count: number
  hours: number
}

export interface WeeklyFlightStats {
  week: string
  count: number
  hours: number
}

export interface ChartPeriodStats {
  key: string
  count: number
  hours: number
  /** Last month in a grouped mobile bucket, when key is the bucket start. */
  rangeEndKey?: string
  /** Stable unique id for chart interaction (differs per bucket even when key repeats). */
  seriesKey?: string
}

export const MOBILE_CHART_MAX_MONTH_BARS = 24

export type ChartPeriodMode = 'month' | '3weeks' | '2weeks' | '1week'

export const CHART_PERIOD_OPTIONS: ReadonlyArray<{ value: ChartPeriodMode; label: string }> = [
  { value: 'month', label: 'month' },
  { value: '3weeks', label: '3 weeks' },
  { value: '2weeks', label: '2 weeks' },
  { value: '1week', label: '1 week' },
]

export function chartPeriodLabel(mode: ChartPeriodMode): string {
  return CHART_PERIOD_OPTIONS.find((option) => option.value === mode)?.label ?? mode
}

export function weekCountForPeriod(mode: ChartPeriodMode): number {
  switch (mode) {
    case '3weeks':
      return 3
    case '2weeks':
      return 2
    case '1week':
      return 1
    default:
      return 0
  }
}

function parseMonthKey(monthKey: string): { year: number; month: number } | null {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/)
  if (!match) {
    return null
  }
  const year = Number(match[1])
  const month = Number(match[2])
  if (!year || month < 1 || month > 12) {
    return null
  }
  return { year, month }
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

function toMonthKey({ year, month }: { year: number; month: number }): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

/** Three-letter month label for chart axis, e.g. 2025-11 → Nov. */
export function formatMonthShortLabel(monthKey: string): string {
  const parsed = parseMonthKey(monthKey)
  if (!parsed) {
    return monthKey
  }
  return new Date(parsed.year, parsed.month - 1, 1).toLocaleString('en', { month: 'short' })
}

export function monthSpanInPeriod(from: string, to: string): number {
  if (!from.trim() || !to.trim()) {
    return 0
  }
  return buildPeriodRangeMonthlySeries([], from, to).length
}

export function shouldHideMonthAxisLabels(
  from: string,
  to: string,
  monthlySeriesLength: number,
): boolean {
  if (from.trim() && to.trim()) {
    return monthSpanInPeriod(from, to) > 12
  }
  return monthlySeriesLength > 12
}

export function chartSparseLabelIndices(seriesLength: number): number[] {
  if (seriesLength <= 0) {
    return []
  }
  if (seriesLength === 1) {
    return [0]
  }
  if (seriesLength === 2) {
    return [0, 1]
  }

  const middle = Math.floor((seriesLength - 1) / 2)
  return [0, middle, seriesLength - 1]
}

export function chartPeriodBoundaryLabels(
  monthKeys: readonly string[],
): { start: string; middle: string; end: string } | null {
  if (!monthKeys.length) {
    return null
  }

  const middleIndex = monthKeys.length === 1 ? 0 : Math.floor((monthKeys.length - 1) / 2)
  return {
    start: formatMonthDetailLabel(monthKeys[0]!),
    middle: formatMonthDetailLabel(monthKeys[middleIndex]!),
    end: formatMonthDetailLabel(monthKeys[monthKeys.length - 1]!),
  }
}

function parseWeekKey(weekKey: string): { year: number; week: number } | null {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/)
  if (!match) {
    return null
  }
  const year = Number(match[1])
  const week = Number(match[2])
  if (!year || week < 1 || week > 53) {
    return null
  }
  return { year, week }
}

function toWeekKey({ year, week }: { year: number; week: number }): string {
  return `${year}-W${String(week).padStart(2, '0')}`
}

function mondayOfIsoWeek(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const day = jan4.getUTCDay() || 7
  const monday = new Date(jan4)
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7)
  return monday
}

function isoWeekFromDate(value: Date): { year: number; week: number } {
  const utc = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const year = utc.getUTCFullYear()
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { year, week }
}

function shiftWeek(year: number, week: number, delta: number): { year: number; week: number } {
  const monday = mondayOfIsoWeek(year, week)
  monday.setUTCDate(monday.getUTCDate() + delta * 7)
  return isoWeekFromDate(
    new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()),
  )
}

/** Week start label for chart axis, e.g. 2025-W45 → 3 Nov. */
export function formatWeekShortLabel(weekKey: string): string {
  const parsed = parseWeekKey(weekKey)
  if (!parsed) {
    return weekKey
  }
  const monday = mondayOfIsoWeek(parsed.year, parsed.week)
  return monday.toLocaleString('en-GB', { day: 'numeric', month: 'short' })
}

export function formatWeekDetailLabel(weekKey: string): string {
  const parsed = parseWeekKey(weekKey)
  if (!parsed) {
    return weekKey
  }
  const monday = mondayOfIsoWeek(parsed.year, parsed.week)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  const start = monday.toLocaleString('en-GB', { day: 'numeric', month: 'short' })
  const end = sunday.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${start} – ${end}`
}

export function formatWeekWindowChipLabel(endWeekKey: string, weekCount: number): string {
  if (weekCount <= 1) {
    return formatWeekShortLabel(endWeekKey)
  }
  const end = parseWeekKey(endWeekKey)
  if (!end) {
    return endWeekKey
  }
  const start = shiftWeek(end.year, end.week, -(weekCount - 1))
  return `${formatWeekShortLabel(toWeekKey(start))} – ${formatWeekShortLabel(endWeekKey)}`
}

export function weekAnchorsForYear(
  items: readonly WeeklyFlightStats[],
  year: number,
): string[] {
  const inYear = [...items]
    .map((item) => item.week)
    .filter((weekKey) => parseWeekKey(weekKey)?.year === year)
    .sort()

  if (!inYear.length) {
    return []
  }

  const first = parseWeekKey(inYear[0]!)
  const last = parseWeekKey(inYear[inYear.length - 1]!)
  if (!first || !last) {
    return inYear
  }

  const anchors: string[] = []
  let current = first
  while (true) {
    anchors.push(toWeekKey(current))
    if (current.year === last.year && current.week === last.week) {
      break
    }
    current = shiftWeek(current.year, current.week, 1)
  }
  return anchors
}

export function defaultWeekAnchorForYear(
  items: readonly WeeklyFlightStats[],
  year: number,
  referenceDate = new Date(),
): string {
  const anchors = weekAnchorsForYear(items, year)
  if (anchors.length) {
    return anchors[anchors.length - 1]!
  }
  const current = isoWeekFromDate(referenceDate)
  if (current.year === year) {
    return toWeekKey(current)
  }
  return toWeekKey({ year, week: 1 })
}

/** Years with flight data, limited to the most recent `maxYears`. */
export function listAvailableChartYears(
  items: readonly MonthlyFlightStats[],
  maxYears = 4,
): number[] {
  const years = new Set<number>()
  for (const item of items) {
    const parsed = parseMonthKey(item.month)
    if (parsed) {
      years.add(parsed.year)
    }
  }
  const sorted = [...years].sort((a, b) => a - b)
  if (sorted.length <= maxYears) {
    return sorted
  }
  return sorted.slice(-maxYears)
}

export function listAvailableChartYearsFromWeeks(
  items: readonly WeeklyFlightStats[],
  maxYears = 4,
): number[] {
  const years = new Set<number>()
  for (const item of items) {
    const parsed = parseWeekKey(item.week)
    if (parsed) {
      years.add(parsed.year)
    }
  }
  const sorted = [...years].sort((a, b) => a - b)
  if (sorted.length <= maxYears) {
    return sorted
  }
  return sorted.slice(-maxYears)
}

export function listAvailableChartYearsCombined(
  monthlyItems: readonly MonthlyFlightStats[],
  weeklyItems: readonly WeeklyFlightStats[],
  maxYears = 4,
): number[] {
  const years = new Set<number>()
  for (const item of monthlyItems) {
    const parsed = parseMonthKey(item.month)
    if (parsed) {
      years.add(parsed.year)
    }
  }
  for (const item of weeklyItems) {
    const parsed = parseWeekKey(item.week)
    if (parsed) {
      years.add(parsed.year)
    }
  }
  const sorted = [...years].sort((a, b) => a - b)
  if (sorted.length <= maxYears) {
    return sorted
  }
  return sorted.slice(-maxYears)
}

export function defaultChartYear(
  availableYears: readonly number[],
  referenceDate = new Date(),
): number {
  if (!availableYears.length) {
    return referenceDate.getFullYear()
  }
  const currentYear = referenceDate.getFullYear()
  if (availableYears.includes(currentYear)) {
    return currentYear
  }
  const latestYear = availableYears[availableYears.length - 1]
  return latestYear ?? currentYear
}

/** All twelve months for a calendar year. */
export function buildYearChartSeries(
  items: readonly MonthlyFlightStats[],
  year: number,
): ChartPeriodStats[] {
  const byMonth = new Map(items.map((item) => [item.month, item]))
  return Array.from({ length: 12 }, (_, index) => {
    const key = toMonthKey({ year, month: index + 1 })
    const existing = byMonth.get(key)
    return {
      key,
      count: existing?.count ?? 0,
      hours: existing?.hours ?? 0,
    }
  })
}

/** Build a fixed-length weekly series ending at the selected week. */
export function buildWeeklyChartSeries(
  items: readonly WeeklyFlightStats[],
  weekCount: number,
  endWeekKey?: string,
  referenceDate = new Date(),
): ChartPeriodStats[] {
  if (weekCount < 1) {
    return []
  }

  const byWeek = new Map(items.map((item) => [item.week, item]))
  const sortedKeys = [...byWeek.keys()].sort()
  const resolvedEndKey =
    endWeekKey ??
    sortedKeys[sortedKeys.length - 1] ??
    toWeekKey(isoWeekFromDate(referenceDate))
  const end = parseWeekKey(resolvedEndKey)
  if (!end) {
    return []
  }

  const series: ChartPeriodStats[] = []
  for (let offset = weekCount - 1; offset >= 0; offset -= 1) {
    const key = toWeekKey(shiftWeek(end.year, end.week, -offset))
    const existing = byWeek.get(key)
    series.push({
      key,
      count: existing?.count ?? 0,
      hours: existing?.hours ?? 0,
    })
  }
  return series
}

/** Build monthly buckets for every month in an inclusive ISO date range. */
export function buildPeriodRangeMonthlySeries(
  items: readonly MonthlyFlightStats[],
  from: string,
  to: string,
): ChartPeriodStats[] {
  const start = parseMonthKey(from.slice(0, 7))
  const end = parseMonthKey(to.slice(0, 7))
  if (!start || !end) {
    return items.map((item) => ({
      key: item.month,
      count: item.count,
      hours: item.hours,
    }))
  }

  const byMonth = new Map(items.map((item) => [item.month, item]))
  const series: ChartPeriodStats[] = []
  let current = start

  while (true) {
    const key = toMonthKey(current)
    const existing = byMonth.get(key)
    series.push({
      key,
      count: existing?.count ?? 0,
      hours: existing?.hours ?? 0,
    })
    if (current.year === end.year && current.month === end.month) {
      break
    }
    current = shiftMonth(current.year, current.month, 1)
  }

  return series
}

/** Build weekly buckets for every ISO week overlapping an inclusive date range. */
export function buildPeriodRangeWeeklySeries(
  items: readonly WeeklyFlightStats[],
  from: string,
  to: string,
): ChartPeriodStats[] {
  const startDate = parseChartIsoDate(from)
  const endDate = parseChartIsoDate(to)
  if (!startDate || !endDate) {
    return items.map((item) => ({
      key: item.week,
      count: item.count,
      hours: item.hours,
    }))
  }

  const byWeek = new Map(items.map((item) => [item.week, item]))
  let current = isoWeekFromDate(startDate)
  const end = isoWeekFromDate(endDate)
  const series: ChartPeriodStats[] = []

  while (true) {
    const key = toWeekKey(current)
    const existing = byWeek.get(key)
    series.push({
      key,
      count: existing?.count ?? 0,
      hours: existing?.hours ?? 0,
    })
    if (current.year === end.year && current.week === end.week) {
      break
    }
    current = shiftWeek(current.year, current.week, 1)
  }

  return series
}

export function formatMonthDetailLabel(monthKey: string): string {
  const parsed = parseMonthKey(monthKey)
  if (!parsed) {
    return monthKey
  }
  return `${formatMonthShortLabel(monthKey)} ${parsed.year}`
}

export function formatMonthRangeDetailLabel(startKey: string, endKey: string): string {
  if (startKey === endKey) {
    return formatMonthDetailLabel(startKey)
  }

  const start = parseMonthKey(startKey)
  const end = parseMonthKey(endKey)
  if (!start || !end) {
    return `${startKey} – ${endKey}`
  }

  const startLabel = formatMonthShortLabel(startKey)
  const endLabel = formatMonthShortLabel(endKey)
  if (start.year === end.year) {
    return `${startLabel} – ${endLabel} ${start.year}`
  }
  return `${startLabel} ${start.year} – ${endLabel} ${end.year}`
}

export function formatMonthChartDetailLabel(item: ChartPeriodStats, year?: number): string {
  if (item.rangeEndKey) {
    return formatMonthRangeDetailLabel(item.key, item.rangeEndKey)
  }
  if (year !== undefined) {
    return `${formatMonthShortLabel(item.key)} ${year}`
  }
  return formatMonthDetailLabel(item.key)
}

export function chartBarSeriesKey(item: ChartPeriodStats, index: number): string {
  if (item.seriesKey) {
    return item.seriesKey
  }

  const endKey = item.rangeEndKey ?? item.key
  return `${index}|${item.key}|${endKey}`
}

export function aggregateMonthlySeriesToMaxBars(
  items: readonly ChartPeriodStats[],
  maxBars: number = MOBILE_CHART_MAX_MONTH_BARS,
): ChartPeriodStats[] {
  if (items.length <= maxBars) {
    return items.map((item, index) => ({
      ...item,
      seriesKey: chartBarSeriesKey(item, index),
    }))
  }

  const bucketSize = Math.ceil(items.length / maxBars)
  const aggregated: ChartPeriodStats[] = []

  for (let index = 0; index < items.length; index += bucketSize) {
    const bucket = items.slice(index, index + bucketSize)
    const first = bucket[0]!
    const last = bucket[bucket.length - 1]!
    const rangeEndKey = last.key !== first.key ? last.key : undefined
    const bucketIndex = aggregated.length

    aggregated.push({
      key: first.key,
      count: bucket.reduce((sum, item) => sum + item.count, 0),
      hours: bucket.reduce((sum, item) => sum + item.hours, 0),
      rangeEndKey,
      seriesKey: `${bucketIndex}|${first.key}|${rangeEndKey ?? first.key}`,
    })
  }

  return aggregated
}

function parseChartIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) {
    return null
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }
  return parsed
}

/** Build a fixed-length monthly series ending at the latest month in the data. */
export function buildMonthlyChartSeries(
  items: readonly MonthlyFlightStats[],
  monthCount = 12,
): MonthlyFlightStats[] {
  if (monthCount < 1) {
    return []
  }

  const byMonth = new Map(items.map((item) => [item.month, item]))
  const sortedKeys = [...byMonth.keys()].sort()
  const endKey =
    sortedKeys[sortedKeys.length - 1] ??
    toMonthKey(shiftMonth(new Date().getFullYear(), new Date().getMonth() + 1, 0))
  const end = parseMonthKey(endKey)
  if (!end) {
    return []
  }

  const series: MonthlyFlightStats[] = []
  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const key = toMonthKey(shiftMonth(end.year, end.month, -offset))
    const existing = byMonth.get(key)
    series.push(
      existing ?? {
        month: key,
        count: 0,
        hours: 0,
      },
    )
  }
  return series
}

export function formatChartHours(value: number): string {
  if (value <= 0) {
    return '0h'
  }
  if (Number.isInteger(value)) {
    return `${value}h`
  }
  return `${value.toFixed(1)}h`
}

export function niceAxisMax(value: number): number {
  if (value <= 0) {
    return 1
  }
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  if (normalized <= 1) {
    return magnitude
  }
  if (normalized <= 2) {
    return 2 * magnitude
  }
  if (normalized <= 5) {
    return 5 * magnitude
  }
  return 10 * magnitude
}

export function axisTicks(maxValue: number, tickCount = 3): number[] {
  const max = niceAxisMax(maxValue)
  if (tickCount <= 1) {
    return [max]
  }
  const step = max / (tickCount - 1)
  return Array.from({ length: tickCount }, (_, index) => Math.round(step * index * 100) / 100)
}
