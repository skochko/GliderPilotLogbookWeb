import { describe, expect, it } from 'vitest'
import {
  buildMonthlyChartSeries,
  buildPeriodRangeMonthlySeries,
  buildPeriodRangeWeeklySeries,
  buildWeeklyChartSeries,
  buildYearChartSeries,
  defaultChartYear,
  formatChartHours,
  formatMonthDetailLabel,
  formatMonthShortLabel,
  formatWeekShortLabel,
  formatWeekWindowChipLabel,
  listAvailableChartYears,
  niceAxisMax,
  weekAnchorsForYear,
} from '../monthlyChart'

describe('formatMonthShortLabel', () => {
  it('returns a three-letter month label', () => {
    expect(formatMonthShortLabel('2025-11')).toBe('Nov')
    expect(formatMonthShortLabel('2025-01')).toBe('Jan')
  })
})

describe('buildPeriodRangeMonthlySeries', () => {
  it('fills every month in the selected period', () => {
    const series = buildPeriodRangeMonthlySeries(
      [
        { month: '2026-06', count: 2, hours: 3 },
        { month: '2026-07', count: 1, hours: 1.5 },
      ],
      '2026-06-15',
      '2026-07-12',
    )

    expect(series).toEqual([
      { key: '2026-06', count: 2, hours: 3 },
      { key: '2026-07', count: 1, hours: 1.5 },
    ])
  })
})

describe('buildPeriodRangeWeeklySeries', () => {
  it('fills every ISO week overlapping the selected period', () => {
    const series = buildPeriodRangeWeeklySeries(
      [
        { week: '2026-W27', count: 1, hours: 1 },
        { week: '2026-W28', count: 2, hours: 2 },
      ],
      '2026-07-01',
      '2026-07-12',
    )

    expect(series.map((item) => item.key)).toEqual(['2026-W27', '2026-W28'])
    expect(series[1]).toEqual({ key: '2026-W28', count: 2, hours: 2 })
  })
})

describe('formatMonthDetailLabel', () => {
  it('includes the year in the detail label', () => {
    expect(formatMonthDetailLabel('2026-07')).toBe('Jul 2026')
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
    expect(series[0]).toEqual({ key: '2025-01', count: 1, hours: 1 })
    expect(series[10]).toEqual({ key: '2025-11', count: 2, hours: 3 })
    expect(series[1]).toEqual({ key: '2025-02', count: 0, hours: 0 })
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

describe('buildWeeklyChartSeries', () => {
  it('returns the requested number of weeks ending at the latest data week', () => {
    const series = buildWeeklyChartSeries(
      [
        { week: '2025-W44', count: 1, hours: 1 },
        { week: '2025-W45', count: 2, hours: 3 },
      ],
      3,
    )

    expect(series).toHaveLength(3)
    expect(series[1]).toEqual({ key: '2025-W44', count: 1, hours: 1 })
    expect(series[2]).toEqual({ key: '2025-W45', count: 2, hours: 3 })
  })

  it('can end at a selected week anchor', () => {
    const series = buildWeeklyChartSeries(
      [
        { week: '2025-W44', count: 1, hours: 1 },
        { week: '2025-W45', count: 2, hours: 3 },
      ],
      2,
      '2025-W44',
    )

    expect(series).toEqual([
      { key: '2025-W43', count: 0, hours: 0 },
      { key: '2025-W44', count: 1, hours: 1 },
    ])
  })
})

describe('weekAnchorsForYear', () => {
  it('fills week anchors between first and last data week in a year', () => {
    expect(
      weekAnchorsForYear(
        [
          { week: '2025-W44', count: 1, hours: 1 },
          { week: '2025-W46', count: 1, hours: 1 },
        ],
        2025,
      ),
    ).toEqual(['2025-W44', '2025-W45', '2025-W46'])
  })
})

describe('formatWeekWindowChipLabel', () => {
  it('returns a range label for multi-week windows', () => {
    expect(formatWeekWindowChipLabel('2025-W45', 3)).toBe('20 Oct – 3 Nov')
  })
})

describe('formatWeekShortLabel', () => {
  it('returns the Monday date for the ISO week', () => {
    expect(formatWeekShortLabel('2025-W45')).toBe('3 Nov')
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
