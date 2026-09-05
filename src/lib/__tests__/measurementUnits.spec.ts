import { describe, expect, it } from 'vitest'
import {
  altitudeScaleValue,
  formatAltitudeValue,
  formatDistanceValue,
  formatVarioValue,
  measurementUnitsFromPreferences,
} from '@/lib/measurementUnits'

describe('measurement units', () => {
  it('defaults invalid or absent preferences to metric', () => {
    expect(measurementUnitsFromPreferences(undefined)).toBe('metric')
    expect(measurementUnitsFromPreferences({ measurement_units: 'unknown' })).toBe('metric')
    expect(measurementUnitsFromPreferences({ measurement_units: 'imperial' })).toBe('imperial')
  })

  it('formats metric values', () => {
    expect(formatAltitudeValue(1000, 'metric')).toBe('1,000 m')
    expect(formatVarioValue(1.25, 'metric')).toBe('+1.3 m/s')
    expect(formatDistanceValue(100, 'metric')).toBe('100 km')
  })

  it('converts values to imperial units', () => {
    expect(formatAltitudeValue(1000, 'imperial')).toBe('3,281 ft')
    expect(formatVarioValue(1, 'imperial')).toBe('+1.9 kt')
    expect(formatDistanceValue(100, 'imperial')).toBe('62 mi')
    expect(altitudeScaleValue(1000, 'imperial')).toBeCloseTo(3280.84, 2)
  })
})
