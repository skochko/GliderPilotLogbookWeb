import { describe, expect, it } from 'vitest'
import { formatPilotRoles, pilotRoleLabel } from '../pilotRoles'

describe('pilotRoles', () => {
  it('maps role codes to labels', () => {
    expect(pilotRoleLabel('p1')).toBe('P1')
    expect(pilotRoleLabel('p2')).toBe('P2')
    expect(pilotRoleLabel('instructor')).toBe('I')
  })

  it('formats multiple roles', () => {
    expect(formatPilotRoles(['p1', 'instructor'])).toBe('P1, I')
    expect(formatPilotRoles([])).toBe('—')
  })
})
