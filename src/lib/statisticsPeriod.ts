export type StatisticsPresetId =
  | 'this_month'
  | 'last_month'
  | 'last_90_days'
  | 'year_to_date'
  | 'custom'

export interface StatisticsPeriod {
  from: string
  to: string
}

export interface StatisticsPreferences {
  statistics_from?: string
  statistics_to?: string
  statistics_preset?: StatisticsPresetId
}

export const STATISTICS_PRESET_OPTIONS: Array<{ id: StatisticsPresetId; label: string }> = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'last_90_days', label: 'Last 90 days' },
  { id: 'year_to_date', label: 'Year to date' },
]

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseIsoDate(value: string): Date | null {
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

export function isValidStatisticsPeriod(period: StatisticsPeriod): boolean {
  const from = parseIsoDate(period.from)
  const to = parseIsoDate(period.to)
  return from !== null && to !== null && from.getTime() <= to.getTime()
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function resolveStatisticsPreset(
  preset: StatisticsPresetId,
  today: Date = new Date(),
): StatisticsPeriod {
  switch (preset) {
    case 'this_month':
      return {
        from: formatIsoDate(startOfMonth(today)),
        to: formatIsoDate(today),
      }
    case 'last_month': {
      const anchor = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      return {
        from: formatIsoDate(startOfMonth(anchor)),
        to: formatIsoDate(endOfMonth(anchor)),
      }
    }
    case 'last_90_days': {
      const from = new Date(today)
      from.setDate(from.getDate() - 89)
      return {
        from: formatIsoDate(from),
        to: formatIsoDate(today),
      }
    }
    case 'year_to_date':
      return {
        from: formatIsoDate(new Date(today.getFullYear(), 0, 1)),
        to: formatIsoDate(today),
      }
    case 'custom':
    default:
      return resolveStatisticsPreset('this_month', today)
  }
}

export function defaultStatisticsPeriod(today: Date = new Date()): StatisticsPeriod {
  return resolveStatisticsPreset('this_month', today)
}

export function readStatisticsPeriodFromPreferences(
  preferences: Record<string, unknown> | undefined,
  today: Date = new Date(),
): { period: StatisticsPeriod; preset: StatisticsPresetId } {
  const presetRaw = preferences?.statistics_preset
  const preset =
    presetRaw === 'this_month' ||
    presetRaw === 'last_month' ||
    presetRaw === 'last_90_days' ||
    presetRaw === 'year_to_date' ||
    presetRaw === 'custom'
      ? presetRaw
      : 'this_month'

  if (preset !== 'custom') {
    return { period: resolveStatisticsPreset(preset, today), preset }
  }

  const from = typeof preferences?.statistics_from === 'string' ? preferences.statistics_from : ''
  const to = typeof preferences?.statistics_to === 'string' ? preferences.statistics_to : ''
  const period = { from, to }
  if (isValidStatisticsPeriod(period)) {
    return { period, preset: 'custom' }
  }

  return { period: defaultStatisticsPeriod(today), preset: 'this_month' }
}

export function buildStatisticsPreferences(
  period: StatisticsPeriod,
  preset: StatisticsPresetId,
): StatisticsPreferences {
  return {
    statistics_from: period.from,
    statistics_to: period.to,
    statistics_preset: preset,
  }
}

export function periodLengthDays(period: StatisticsPeriod): number {
  const from = parseIsoDate(period.from)
  const to = parseIsoDate(period.to)
  if (!from || !to) {
    return 0
  }
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((to.getTime() - from.getTime()) / msPerDay) + 1
}

export function preferredChartMode(period: StatisticsPeriod): 'month' | '1week' {
  return periodLengthDays(period) > 92 ? 'month' : '1week'
}
