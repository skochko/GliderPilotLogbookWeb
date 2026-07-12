import { describe, expect, it } from 'vitest'
import {
  defaultStatisticsPeriod,
  isValidStatisticsPeriod,
  periodLengthDays,
  preferredChartMode,
  readStatisticsPeriodFromPreferences,
  resolveStatisticsPreset,
} from '../statisticsPeriod'

describe('statisticsPeriod', () => {
  const today = new Date(2026, 6, 12)

  it('resolves this month preset', () => {
    expect(resolveStatisticsPreset('this_month', today)).toEqual({
      from: '2026-07-01',
      to: '2026-07-12',
    })
  })

  it('resolves last month preset', () => {
    expect(resolveStatisticsPreset('last_month', today)).toEqual({
      from: '2026-06-01',
      to: '2026-06-30',
    })
  })

  it('resolves last 90 days preset', () => {
    expect(resolveStatisticsPreset('last_90_days', today)).toEqual({
      from: '2026-04-14',
      to: '2026-07-12',
    })
  })

  it('reads saved custom period from preferences', () => {
    const result = readStatisticsPeriodFromPreferences(
      {
        statistics_preset: 'custom',
        statistics_from: '2026-01-01',
        statistics_to: '2026-03-31',
      },
      today,
    )

    expect(result.preset).toBe('custom')
    expect(result.period).toEqual({ from: '2026-01-01', to: '2026-03-31' })
  })

  it('falls back to this month for invalid custom period', () => {
    const result = readStatisticsPeriodFromPreferences(
      {
        statistics_preset: 'custom',
        statistics_from: 'bad',
        statistics_to: '2026-03-31',
      },
      today,
    )

    expect(result.preset).toBe('this_month')
    expect(result.period).toEqual(defaultStatisticsPeriod(today))
  })

  it('chooses chart mode from period length', () => {
    expect(
      preferredChartMode({
        from: '2026-07-01',
        to: '2026-07-12',
      }),
    ).toBe('1week')
    expect(
      preferredChartMode({
        from: '2026-01-01',
        to: '2026-07-12',
      }),
    ).toBe('month')
    expect(periodLengthDays({ from: '2026-07-01', to: '2026-07-12' })).toBe(12)
    expect(isValidStatisticsPeriod({ from: '2026-07-12', to: '2026-07-01' })).toBe(false)
  })
})
