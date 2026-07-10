import { describe, expect, it } from 'vitest'
import {
  buildMonthlyChartSeries,
  buildYearChartSeries,
  defaultChartYear,
  formatChartHours,
  formatMonthShortLabel,
  listAvailableChartYears,
  niceAxisMax,
} from '../monthlyChart'

describe('formatMonthShortLabel', () => {
  it('returns a three-letter month label', () => {
    expect(formatMonthShortLabel('2025-11')).toBe('Nov')
    expect(formatMonthShortLabel('2025-01')).toBe('Jan')
  })
})

describe('buildYearChartSeries', () => {
  it('returns all twelve months for the selected year', () => {
    const series = buildYearChartSeries(
      [
        { month: '2025-01', count: 1, hours: 1 },
        { month: '2025-11', count: 2, hours: 3 },
      ],
      2025,
    )

    expect(series).toHaveLength(12)
    expect(series[0]).toEqual({ month: '2025-01', count: 1, hours: 1 })
    expect(series[10]).toEqual({ month: '2025-11', count: 2, hours: 3 })
    expect(series[1]).toEqual({ month: '2025-02', count: 0, hours: 0 })
  })
})

describe('listAvailableChartYears', () => {
  it('returns sorted years capped to the most recent four', () => {
    const years = listAvailableChartYears([
      { month: '2021-05', count: 1, hours: 1 },
      { month: '2022-05', count: 1, hours: 1 },
      { month: '2023-05', count: 1, hours: 1 },
      { month: '2024-05', count: 1, hours: 1 },
      { month: '2025-05', count: 1, hours: 1 },
      { month: '2026-05', count: 1, hours: 1 },
    ])

    expect(years).toEqual([2023, 2024, 2025, 2026])
  })
})

describe('defaultChartYear', () => {
  it('prefers the current calendar year when available', () => {
    expect(defaultChartYear([2024, 2025, 2026], new Date('2026-07-10'))).toBe(2026)
    expect(defaultChartYear([2024, 2025], new Date('2026-07-10'))).toBe(2025)
  })
})

describe('buildMonthlyChartSeries', () => {
  it('fills missing months and keeps chronological order', () => {
    const series = buildMonthlyChartSeries(
      [
        { month: '2025-10', count: 2, hours: 3 },
        { month: '2025-11', count: 1, hours: 1.5 },
      ],
      3,
    )

    expect(series).toEqual([
      { month: '2025-09', count: 0, hours: 0 },
      { month: '2025-10', count: 2, hours: 3 },
      { month: '2025-11', count: 1, hours: 1.5 },
    ])
  })
})

describe('niceAxisMax', () => {
  it('rounds up to readable chart limits', () => {
    expect(niceAxisMax(0)).toBe(1)
    expect(niceAxisMax(7)).toBe(10)
    expect(niceAxisMax(23)).toBe(50)
  })
})

describe('formatChartHours', () => {
  it('formats hour labels for the axis', () => {
    expect(formatChartHours(0)).toBe('0h')
    expect(formatChartHours(5)).toBe('5h')
    expect(formatChartHours(5.5)).toBe('5.5h')
  })
})
