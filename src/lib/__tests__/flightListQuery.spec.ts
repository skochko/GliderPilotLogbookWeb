import { describe, expect, it } from 'vitest'
import {
  applyFlightDatePreset,
  emptyFlightListFilters,
  flightListFiltersToParams,
  hasActiveFlightListFilters,
  queryFromSortPreset,
  resolveFlightListDateRange,
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
    expect(hasActiveFlightListFilters({ ...emptyFlightListFilters(), date_preset: 'this_month' })).toBe(true)
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
})
