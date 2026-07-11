import { describe, expect, it } from 'vitest'
import { automationStatusLabel, automationStatusStyles } from '../automationStatus'

describe('automationStatus', () => {
  it('maps known statuses to labels', () => {
    expect(automationStatusLabel('pending')).toBe('Pending')
    expect(automationStatusLabel('completed')).toBe('Completed')
  })

  it('returns styles for known statuses', () => {
    expect(automationStatusStyles('approved')).toContain('emerald')
    expect(automationStatusStyles('rejected')).toContain('red')
  })
})
