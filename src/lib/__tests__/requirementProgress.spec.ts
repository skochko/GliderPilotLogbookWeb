import { describe, expect, it } from 'vitest'
import { formatRequirementProgress } from '../requirementProgress'

describe('formatRequirementProgress', () => {
  it('formats duration requirements', () => {
    expect(
      formatRequirementProgress({
        obtained: '3:00',
        required: '5:00',
        requirement_type: 'duration',
      }),
    ).toBe('3h of 5h required')
  })

  it('formats count requirements with launches', () => {
    expect(
      formatRequirementProgress({
        id: 'launches',
        obtained: '8',
        required: '15',
        requirement_type: 'count',
      }),
    ).toBe('8 of 15 launches required')
  })

  it('formats training flight requirements', () => {
    expect(
      formatRequirementProgress({
        id: 'training_flights_fi',
        obtained: '1',
        required: '2',
        requirement_type: 'training_flight',
      }),
    ).toBe('1 of 2 training flights required')
  })

  it('includes remaining days for a current training flight requirement', () => {
    expect(
      formatRequirementProgress({
        id: 'training_flights_fi',
        obtained: '2',
        required: '2',
        requirement_type: 'training_flight',
        remaining_days: 83,
      }),
    ).toBe('2 of 2 training flights required · 83 days remaining')
  })

  it('formats launch method chips', () => {
    expect(
      formatRequirementProgress({
        id: 'launch_winch',
        obtained: '2',
        required: '5',
        requirement_type: 'launch_method',
      }),
    ).toBe('2 of 5 launches required')
  })

  it('formats boolean requirements as recorded', () => {
    expect(
      formatRequirementProgress({
        id: 'instructor_refresher',
        obtained: 'yes',
        required: 'yes',
        requirement_type: 'boolean',
        status: 'current',
      }),
    ).toBe('Recorded')
  })

  it('includes remaining days for a current boolean requirement', () => {
    expect(
      formatRequirementProgress({
        id: 'fi_demonstration',
        obtained: 'yes',
        required: 'yes',
        requirement_type: 'boolean',
        status: 'current',
        remaining_days: 1517,
      }),
    ).toBe('Recorded · 4 years 57 days remaining')
  })

  it('omits zero residual days for an exact number of years', () => {
    expect(
      formatRequirementProgress({
        id: 'fi_demonstration',
        obtained: 'yes',
        required: 'yes',
        requirement_type: 'boolean',
        status: 'current',
        remaining_days: 730,
      }),
    ).toBe('Recorded · 2 years remaining')
  })

  it('uses singular labels for one year and one day', () => {
    expect(
      formatRequirementProgress({
        id: 'instructor_refresher',
        obtained: 'yes',
        required: 'yes',
        requirement_type: 'boolean',
        status: 'current',
        remaining_days: 366,
      }),
    ).toBe('Recorded · 1 year 1 day remaining')
  })

  it('keeps boolean validity in days when one year or less remains', () => {
    expect(
      formatRequirementProgress({
        id: 'instructor_refresher',
        obtained: 'yes',
        required: 'yes',
        requirement_type: 'boolean',
        status: 'current',
        remaining_days: 365,
      }),
    ).toBe('Recorded · 365 days remaining')
  })

  it('formats boolean requirements as not recorded with lookback', () => {
    expect(
      formatRequirementProgress({
        id: 'instructor_refresher',
        obtained: 'no',
        required: 'yes',
        requirement_type: 'boolean',
        lookback_period: '3 years',
        status: 'expired',
      }),
    ).toBe('Not recorded in the last 3 years')
  })

  it('returns empty string when no values', () => {
    expect(formatRequirementProgress({ obtained: '', required: '' })).toBe('')
  })
})
