import { describe, expect, it } from 'vitest'
import { formatDecimalHours, formatDurationDisplay, formatRequirementValue } from '../duration'

describe('formatDurationDisplay', () => {
  it('formats hour-only durations without leading zeros', () => {
    expect(formatDurationDisplay('05:00')).toBe('5h')
    expect(formatDurationDisplay('5:00')).toBe('5h')
  })

  it('formats hours and minutes', () => {
    expect(formatDurationDisplay('23:42')).toBe('23h 42m')
    expect(formatDurationDisplay('5:30')).toBe('5h 30m')
  })

  it('formats sub-hour durations as minutes', () => {
    expect(formatDurationDisplay('0:30')).toBe('30m')
  })

  it('rounds seconds in H:MM:SS values', () => {
    expect(formatDurationDisplay('1:02:30')).toBe('1h 3m')
  })

  it('passes through non-duration values', () => {
    expect(formatDurationDisplay('201')).toBe('201')
    expect(formatDurationDisplay('yes')).toBe('yes')
  })

  it('returns dash for empty values', () => {
    expect(formatDurationDisplay('')).toBe('—')
    expect(formatRequirementValue(null)).toBe('—')
  })
})

describe('formatDecimalHours', () => {
  it('formats decimal hours for dashboard totals', () => {
    expect(formatDecimalHours(3.5)).toBe('3h 30m')
    expect(formatDecimalHours(5)).toBe('5h')
    expect(formatDecimalHours(0)).toBe('0h')
    expect(formatDecimalHours(101.58)).toBe('101h 35m')
  })
})
