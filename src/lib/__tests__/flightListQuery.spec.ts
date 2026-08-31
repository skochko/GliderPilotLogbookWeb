import { describe, expect, it } from 'vitest'
import {
  applyFlightDatePreset,
  emptyFlightListFilters,
  flightListFiltersToParams,
  flightListStateFromQuery,
  flightListStateToQuery,
  hasActiveFlightListFilters,
  queryFromSortPreset,
  resolveFlightListDateRange,
  safeFlightsReturnTo,
  sortPresetFromQuery,
} from '@/lib/flightListQuery'

describe('flightListQuery', () => {
  it('maps sort presets to API query params', () => {
    expect(queryFromSortPreset('duration_longest_first')).toEqual({
      sort_by: 'flight_time',
      sort_direction: 'newest_first',
    })
  })

  it('resolves sort preset from API values', () => {
    expect(sortPresetFromQuery('flight_time', 'newest_last')).toBe('duration_shortest_first')
  })

  it('detects active filters', () => {
    expect(hasActiveFlightListFilters(emptyFlightListFilters())).toBe(false)
    expect(hasActiveFlightListFilters({ ...emptyFlightListFilters(), glider: 'ASK-21' })).toBe(true)
    expect(hasActiveFlightListFilters({ ...emptyFlightListFilters(), role: 'p1' })).toBe(true)
    expect(hasActiveFlightListFilters({ ...emptyFlightListFilters(), role: 'solo' })).toBe(true)
    expect(
      hasActiveFlightListFilters({ ...emptyFlightListFilters(), role: 'under_instruction' }),
    ).toBe(true)
    expect(
      hasActiveFlightListFilters({ ...emptyFlightListFilters(), date_preset: 'this_month' }),
    ).toBe(true)
  })

  it('omits empty filter params', () => {
    expect(flightListFiltersToParams(emptyFlightListFilters())).toEqual({})
    expect(
      flightListFiltersToParams({
        glider: 'ASK-21',
        registration: '',
        launch_type: 'Winch',
        role: 'p2',
        date_preset: 'custom',
        date_from: '2025-01-01',
        date_to: '',
      }),
    ).toEqual({
      glider: 'ASK-21',
      launch_type: 'Winch',
      role: 'p2',
      from: '2025-01-01',
    })
  })

  it('resolves date presets for API requests', () => {
    const filters = applyFlightDatePreset(emptyFlightListFilters(), 'year_to_date')
    const range = resolveFlightListDateRange(filters)
    expect(range.from).toMatch(/^\d{4}-01-01$/)
    expect(range.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('round-trips list filters and sorting through route query', () => {
    const filters = {
      ...emptyFlightListFilters(),
      glider: 'ASK-21',
      role: 'solo' as const,
      date_preset: 'custom' as const,
      date_from: '2026-01-01',
      date_to: '2026-08-30',
    }
    const query = flightListStateToQuery('duration_longest_first', filters)

    expect(query).toEqual({
      sort: 'duration_longest_first',
      glider: 'ASK-21',
      role: 'solo',
      date_preset: 'custom',
      from: '2026-01-01',
      to: '2026-08-30',
    })
    expect(flightListStateFromQuery(query)).toEqual({
      sortPreset: 'duration_longest_first',
      filters,
    })
  })

  it('only accepts internal flights return paths', () => {
    expect(safeFlightsReturnTo('/flights?role=solo')).toBe('/flights?role=solo')
    expect(safeFlightsReturnTo('https://example.com')).toBe('/flights')
    expect(safeFlightsReturnTo('/settings')).toBe('/flights')
  })

  it('restores under-instruction filter from route query', () => {
    expect(flightListStateFromQuery({ role: 'under_instruction' }).filters.role).toBe(
      'under_instruction',
    )
  })
})
