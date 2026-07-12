import { describe, expect, it } from 'vitest'
import { crewMembersFromFlight, formatPilotRoles, formatRoleCompanionDisplay, formatRoleCompanionName, pilotRoleLabel, roleCompanionName } from '../pilotRoles'

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

  it('picks companion name for role column', () => {
    expect(roleCompanionName(['p2'], { pilot: 'Alice', copilot: 'Bob' })).toBe('Alice')
    expect(roleCompanionName(['p1'], { pilot: 'Alice', copilot: 'Bob' })).toBe('Bob')
    expect(roleCompanionName(['instructor'], { pilot: 'Alice', copilot: 'Bob' })).toBe('Bob')
    expect(roleCompanionName(['p1'], { pilot: 'Alice', copilot: '' })).toBe('')
  })

  it('truncates companion name to 17 characters with ellipsis', () => {
    expect(formatRoleCompanionName('Short Name')).toBe('Short Name')
    expect(formatRoleCompanionName('Exactly17Chars!!!')).toBe('Exactly17Chars!!!')
    expect(formatRoleCompanionName('This name is way too long')).toBe('This name is w...')
    expect(formatRoleCompanionName('This name is way too long').length).toBe(17)
    expect(
      formatRoleCompanionDisplay(['p2'], { pilot: 'This name is way too long', copilot: '' }),
    ).toBe('This name is w...')
  })

  it('builds crew members from pilot and copilot columns', () => {
    expect(
      crewMembersFromFlight({ pilot: 'Rick Wiles', copilot: 'Bob Smith' }),
    ).toEqual([
      { name: 'Rick Wiles', role: 'p1' },
      { name: 'Bob Smith', role: 'p2' },
    ])
    expect(crewMembersFromFlight({ pilot: 'Rick Wiles', copilot: '' })).toEqual([
      { name: 'Rick Wiles', role: 'p1' },
    ])
    expect(crewMembersFromFlight({ pilot: '', copilot: '' })).toEqual([])
  })
})
