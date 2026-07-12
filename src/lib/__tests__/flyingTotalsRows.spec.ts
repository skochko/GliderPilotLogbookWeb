import { describe, expect, it } from 'vitest'
import {
  buildFlyingTotalsRows,
  flyingBreakdownRows,
  flyingSummaryRows,
} from '@/lib/flyingTotalsRows'
import type { Statistics } from '@/types'

function baseStatistics(overrides: Partial<Statistics> = {}): Statistics {
  return {
    total_flights: 10,
    total_flight_hours: 5.5,
    total_pic_hours: 3,
    total_p2_hours: 1.5,
    total_instructor_hours: 0,
    pic_flights: 6,
    p2_flights: 2,
    instructor_flights: 0,
    solo_flights: 4,
    solo_landings: 4,
    solo_hours: 2,
    total_launches: 10,
    days_flown: 3,
    avg_flight_hours: 0.55,
    flights_by_month: [],
    flights_by_week: [],
    flights_by_glider: [],
    flights_by_launch_type: [],
    recent_activity: [],
    ...overrides,
  }
}

describe('flyingTotalsRows', () => {
  it('builds total, role, and solo rows', () => {
    const rows = buildFlyingTotalsRows(baseStatistics())
    expect(rows.map((row) => row.key)).toEqual(['total', 'p1', 'p2', 'solo'])
  })

  it('includes instructor when present', () => {
    const rows = buildFlyingTotalsRows(
      baseStatistics({ total_instructor_hours: 1, instructor_flights: 2 }),
    )
    expect(rows.map((row) => row.key)).toContain('instructor')
  })

  it('splits summary and breakdown rows', () => {
    const rows = buildFlyingTotalsRows(
      baseStatistics({ total_instructor_hours: 1, instructor_flights: 1 }),
    )
    expect(flyingSummaryRows(rows).map((row) => row.key)).toEqual(['total', 'solo'])
    expect(flyingBreakdownRows(rows).map((row) => row.key)).toEqual(['p1', 'p2', 'instructor'])
  })
})
