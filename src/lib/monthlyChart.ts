export interface MonthlyFlightStats {
  month: string
  count: number
  hours: number
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
): MonthlyFlightStats[] {
  const byMonth = new Map(items.map((item) => [item.month, item]))
  return Array.from({ length: 12 }, (_, index) => {
    const key = toMonthKey({ year, month: index + 1 })
    return (
      byMonth.get(key) ?? {
        month: key,
        count: 0,
        hours: 0,
      }
    )
  })
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
