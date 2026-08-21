import { describe, expect, it } from 'vitest'
import type { QualificationEvent } from '@/types/qualificationEvents'
import { sortQualificationEventsNewestFirst } from '../sort'

function event(date_completed: string, remarks: string): QualificationEvent {
  return {
    date: date_completed,
    date_completed,
    place: '',
    event_type: 'Proficiency check',
    remarks,
  }
}

describe('sortQualificationEventsNewestFirst', () => {
  it('puts newest events first and undated events last', () => {
    const result = sortQualificationEventsNewestFirst([
      event('2024-01-10', 'old'),
      event('', 'undated'),
      event('2026-08-21', 'new'),
      event('2025-06-01', 'middle'),
    ])

    expect(result.map((item) => item.remarks)).toEqual(['new', 'middle', 'old', 'undated'])
  })

  it('preserves the source order for equal dates', () => {
    const result = sortQualificationEventsNewestFirst([
      event('2026-08-21', 'first'),
      event('2026-08-21', 'second'),
    ])

    expect(result.map((item) => item.remarks)).toEqual(['first', 'second'])
  })
})
