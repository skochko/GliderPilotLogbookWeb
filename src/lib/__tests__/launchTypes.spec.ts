import { describe, expect, it } from 'vitest'
import {
  isKnownLaunchTypeCode,
  launchTypeSelectLabel,
  launchTypeSelectOptions,
  normalizeLaunchTypeCode,
} from '../launchTypes'

describe('launchTypes', () => {
  it('maps legacy labels to canonical codes', () => {
    expect(normalizeLaunchTypeCode('Winch')).toBe('W')
    expect(normalizeLaunchTypeCode('Aerotow')).toBe('A')
    expect(normalizeLaunchTypeCode('Motor Glider')).toBe('MG')
    expect(normalizeLaunchTypeCode('W')).toBe('W')
  })

  it('recognises canonical codes', () => {
    expect(isKnownLaunchTypeCode('W')).toBe(true)
    expect(isKnownLaunchTypeCode('MG')).toBe(true)
    expect(isKnownLaunchTypeCode('Winch')).toBe(false)
    expect(isKnownLaunchTypeCode('Car tow')).toBe(false)
  })

  it('formats select labels as "Name (code)"', () => {
    expect(launchTypeSelectLabel('W')).toBe('Winch (W)')
    expect(launchTypeSelectLabel('Winch')).toBe('Winch (W)')
    expect(launchTypeSelectLabel('Car tow')).toBe('Car tow')
  })

  it('prepends unknown current value for edit compatibility', () => {
    const options = launchTypeSelectOptions('Car tow')
    expect(options[0]).toEqual({ value: 'Car tow', label: 'Car tow' })
    expect(options.some((option) => option.value === 'W')).toBe(true)
    expect(launchTypeSelectOptions('W').some((option) => option.value === 'Car tow')).toBe(false)
  })
})
