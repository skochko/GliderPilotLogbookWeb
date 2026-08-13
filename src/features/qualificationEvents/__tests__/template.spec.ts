import { describe, expect, it } from 'vitest'
import { resolveQualificationEventsTemplate } from '../template'

describe('resolveQualificationEventsTemplate', () => {
  it('routes v3 to the event list', () => {
    expect(resolveQualificationEventsTemplate('v3')).toBe('v3')
  })

  it('routes legacy and missing metadata to legacy summary dates', () => {
    expect(resolveQualificationEventsTemplate('legacy')).toBe('legacy')
    expect(resolveQualificationEventsTemplate(null)).toBe('legacy')
  })
})
