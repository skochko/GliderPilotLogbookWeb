import { describe, expect, it } from 'vitest'
import { isLegacyLookupValue, withLegacyLookupOption } from '@/composables/useLicenseOptions'

const options = [
  { code: 'none', name: 'No license' },
  { code: 'spl', name: 'SPL' },
]

describe('license lookup compatibility', () => {
  it('preserves and marks a value read from the logbook', () => {
    expect(withLegacyLookupOption(options, 'SFCL')).toContainEqual({
      code: 'SFCL',
      name: 'SFCL (from logbook)',
    })
    expect(isLegacyLookupValue(options, 'SFCL')).toBe(true)
  })

  it('does not mark configured values', () => {
    expect(isLegacyLookupValue(options, 'SPL')).toBe(false)
  })
})
