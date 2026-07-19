import type { FlightDatePresetId, FlightListFilters, FlightPilotRoleFilter, FlightSortBy } from '@/types'
import { resolveStatisticsPreset } from '@/lib/statisticsPeriod'

export type FlightListSortPreset =
  | 'date_newest_first'
  | 'date_oldest_first'
  | 'duration_longest_first'
  | 'duration_shortest_first'

export const FLIGHT_LIST_SORT_OPTIONS: ReadonlyArray<{
  id: FlightListSortPreset
  label: string
  sort_by: FlightSortBy
  sort_direction: string
}> = [
  { id: 'date_newest_first', label: 'Date (newest first)', sort_by: 'date', sort_direction: 'newest_first' },
  { id: 'date_oldest_first', label: 'Date (oldest first)', sort_by: 'date', sort_direction: 'newest_last' },
  {
    id: 'duration_longest_first',
    label: 'Duration (longest first)',
    sort_by: 'flight_time',
    sort_direction: 'newest_first',
  },
  {
    id: 'duration_shortest_first',
    label: 'Duration (shortest first)',
    sort_by: 'flight_time',
    sort_direction: 'newest_last',
  },
]

export const FLIGHT_DATE_PRESET_OPTIONS: ReadonlyArray<{ id: FlightDatePresetId; label: string }> = [
  { id: 'all_time', label: 'All time' },
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'last_90_days', label: 'Last 90 days' },
  { id: 'year_to_date', label: 'Year to date' },
  { id: 'custom', label: 'Custom' },
]

export const FLIGHT_ROLE_FILTER_OPTIONS: ReadonlyArray<{
  value: FlightPilotRoleFilter
  label: string
}> = [
  { value: '', label: 'All roles' },
  { value: 'p1', label: 'P1' },
  { value: 'p2', label: 'P2' },
  { value: 'instructor', label: 'Instructor' },
]

export function sortPresetFromQuery(sortBy: FlightSortBy, sortDirection: string): FlightListSortPreset {
  const match = FLIGHT_LIST_SORT_OPTIONS.find(
    (option) => option.sort_by === sortBy && option.sort_direction === sortDirection,
  )
  return match?.id ?? 'date_newest_first'
}

export function queryFromSortPreset(preset: FlightListSortPreset): {
  sort_by: FlightSortBy
  sort_direction: string
} {
  const option = FLIGHT_LIST_SORT_OPTIONS.find((item) => item.id === preset) ?? FLIGHT_LIST_SORT_OPTIONS[0]!
  return {
    sort_by: option.sort_by,
    sort_direction: option.sort_direction,
  }
}

export function emptyFlightListFilters(): FlightListFilters {
  return {
    glider: '',
    registration: '',
    launch_type: '',
    role: '',
    date_preset: 'all_time',
    date_from: '',
    date_to: '',
  }
}

export function hasActiveFlightListFilters(filters: FlightListFilters): boolean {
  return Boolean(
    filters.glider ||
      filters.registration ||
      filters.launch_type ||
      filters.role ||
      (filters.date_preset && filters.date_preset !== 'all_time') ||
      filters.date_from ||
      filters.date_to,
  )
}

export function resolveFlightListDateRange(filters: FlightListFilters): {
  from?: string
  to?: string
} {
  const preset = filters.date_preset ?? 'all_time'
  if (preset === 'all_time') {
    return {}
  }
  if (preset !== 'custom') {
    const period = resolveStatisticsPreset(preset)
    return {
      from: period.from || undefined,
      to: period.to || undefined,
    }
  }
  return {
    from: filters.date_from || undefined,
    to: filters.date_to || undefined,
  }
}

export function flightListFiltersToParams(filters: FlightListFilters): Pick<
  import('@/types').FlightListParams,
  'glider' | 'registration' | 'launch_type' | 'role' | 'from' | 'to'
> {
  const dates = resolveFlightListDateRange(filters)
  return {
    glider: filters.glider || undefined,
    registration: filters.registration || undefined,
    launch_type: filters.launch_type || undefined,
    role: filters.role || undefined,
    from: dates.from,
    to: dates.to,
  }
}

export function applyFlightDatePreset(
  filters: FlightListFilters,
  preset: FlightDatePresetId,
): FlightListFilters {
  if (preset === 'custom') {
    return { ...filters, date_preset: preset }
  }
  if (preset === 'all_time') {
    return { ...filters, date_preset: preset, date_from: '', date_to: '' }
  }
  const period = resolveStatisticsPreset(preset)
  return {
    ...filters,
    date_preset: preset,
    date_from: period.from,
    date_to: period.to,
  }
}
