import { describe, expect, it } from 'vitest'
import { formatDecimalHours, formatDurationDisplay, formatDurationProse, formatRequirementValue, hasDurationValue, splitDurationDisplay } from '../duration'

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

describe('splitDurationDisplay', () => {
  it('splits hours and minutes onto two lines', () => {
    expect(splitDurationDisplay('1:30')).toEqual({ primary: '1h', secondary: '30m' })
    expect(splitDurationDisplay('5:00')).toEqual({ primary: '5h', secondary: null })
    expect(splitDurationDisplay('0:30')).toEqual({ primary: '30m', secondary: null })
  })
})

describe('formatDurationProse', () => {
  it('formats readable durations for detail views', () => {
    expect(formatDurationProse('0:01')).toBe('1 min')
    expect(formatDurationProse('1:00')).toBe('1 h')
    expect(formatDurationProse('1:30')).toBe('1 h 30 min')
    expect(formatDurationProse('0:30')).toBe('30 min')
  })
})

describe('hasDurationValue', () => {
  it('detects non-empty durations', () => {
    expect(hasDurationValue('1:00')).toBe(true)
    expect(hasDurationValue('')).toBe(false)
    expect(hasDurationValue('0:00')).toBe(false)
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
