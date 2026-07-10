import { parseDurationHours } from '@/lib/duration'

export type PilotRole = 'p1' | 'p2' | 'instructor'

const PILOT_ROLE_LABELS: Record<PilotRole, string> = {
  p1: 'P1',
  p2: 'P2',
  instructor: 'I',
}

export const pilotRoleStyles: Record<PilotRole, string> = {
  p1: 'bg-sky-100 text-sky-800 ring-sky-200',
  p2: 'bg-violet-100 text-violet-800 ring-violet-200',
  instructor: 'bg-amber-100 text-amber-900 ring-amber-200',
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

export function pilotRolesFromFlight(flight: {
  pic_time?: string | null
  dual_time?: string | null
  instructor_time?: string | null
}): PilotRole[] {
  const roles: PilotRole[] = []
  if (parseDurationHours(flight.pic_time) > 0) {
    roles.push('p1')
  }
  if (parseDurationHours(flight.dual_time) > 0) {
    roles.push('p2')
  }
  if (parseDurationHours(flight.instructor_time) > 0) {
    roles.push('instructor')
  }
  return roles
}
