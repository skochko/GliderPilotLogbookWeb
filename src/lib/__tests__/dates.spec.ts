import { describe, expect, it } from 'vitest'
import { formatDate, formatDayNumber, formatMonthYear, groupByMonth } from '../dates'

describe('formatDate', () => {
  it('formats ISO dates using python-style patterns', () => {
    expect(formatDate('2025-11-08', '%Y-%m-%d')).toBe('2025-11-08')
    expect(formatDate('2025-11-08', '%d/%m/%Y')).toBe('08/11/2025')
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
