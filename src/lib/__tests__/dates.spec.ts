import { describe, expect, it } from 'vitest'
import {
  formatDate,
  formatDayNumber,
  formatDisplayDate,
  formatMonthYear,
  formatRemainingDays,
  groupByMonth,
} from '../dates'

describe('formatDate', () => {
  it('formats ISO dates using python-style patterns', () => {
    expect(formatDate('2025-11-08', '%Y-%m-%d')).toBe('2025-11-08')
    expect(formatDate('2025-11-08', '%d/%m/%Y')).toBe('08/11/2025')
    expect(formatDate('2025-11-08', '%d-%b-%y')).toBe('08-Nov-25')
  })

  it('returns empty string for blank input', () => {
    expect(formatDate('', '%Y-%m-%d')).toBe('')
  })
})

describe('formatDayNumber', () => {
  it('returns day without leading zero', () => {
    expect(formatDayNumber('2025-11-08')).toBe('8')
    expect(formatDayNumber('2025-01-15')).toBe('15')
  })
})

describe('formatMonthYear', () => {
  it('returns localized month and year', () => {
    expect(formatMonthYear('2025-11-08')).toBe('November 2025')
  })
})

describe('formatDisplayDate', () => {
  it('formats ISO dates for display', () => {
    expect(formatDisplayDate('2035-10-07')).toBe('7 Oct 2035')
  })
})

describe('formatRemainingDays', () => {
  it('formats remaining days in human-readable text', () => {
    expect(formatRemainingDays(1)).toBe('1 day left')
    expect(formatRemainingDays(45)).toBe('45 days left')
    expect(formatRemainingDays(365)).toBe('1 year left')
    expect(formatRemainingDays(3377)).toBe('9y 3m left')
    expect(formatRemainingDays(0)).toBe('Expired')
    expect(formatRemainingDays(null)).toBe('—')
  })
})

describe('groupByMonth', () => {
  it('groups consecutive flights by month', () => {
    const groups = groupByMonth([
      { date: '2025-11-08', id: 'a' },
      { date: '2025-11-02', id: 'b' },
      { date: '2025-10-31', id: 'c' },
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0]?.label).toBe('November 2025')
    expect(groups[0]?.items).toHaveLength(2)
    expect(groups[1]?.label).toBe('October 2025')
    expect(groups[1]?.items).toHaveLength(1)
  })
})
