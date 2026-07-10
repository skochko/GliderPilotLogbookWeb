export type PilotRole = 'p1' | 'p2' | 'instructor'

const PILOT_ROLE_LABELS: Record<PilotRole, string> = {
  p1: 'P1',
  p2: 'P2',
  instructor: 'I',
}

export function pilotRoleLabel(role: PilotRole): string {
  return PILOT_ROLE_LABELS[role]
}

export function formatPilotRoles(roles: readonly PilotRole[]): string {
  if (!roles.length) {
    return '—'
  }
  return roles.map(pilotRoleLabel).join(', ')
}
