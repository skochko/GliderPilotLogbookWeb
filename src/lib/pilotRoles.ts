import { parseDurationHours } from '@/lib/duration'

export type PilotRole = 'p1' | 'p2' | 'instructor'

export type CrewMemberRole = 'p1' | 'p2'

export type CrewMember = {
  name: string
  role: CrewMemberRole
}

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

/** Shared pill styling for flight list and detail badges. */
export const flightSummaryBadgeBaseClass =
  'inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset'

/** Neutral badge styling for launch type, landings, etc. */
export const flightSummaryMetaBadgeClass = 'bg-slate-100 text-slate-700 ring-slate-200'

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

export function crewMembersFromFlight(flight: {
  pilot?: string | null
  copilot?: string | null
}): CrewMember[] {
  const members: CrewMember[] = []
  const pilot = flight.pilot?.trim()
  const copilot = flight.copilot?.trim()

  if (pilot) {
    members.push({ name: pilot, role: 'p1' })
  }
  if (copilot) {
    members.push({ name: copilot, role: 'p2' })
  }

  return members
}

export function roleCompanionName(
  roles: readonly PilotRole[],
  names: { pilot?: string | null; copilot?: string | null },
): string {
  const pilot = names.pilot?.trim() ?? ''
  const copilot = names.copilot?.trim() ?? ''

  if (roles.includes('p2')) {
    return pilot
  }
  if (roles.includes('p1')) {
    return copilot
  }
  if (roles.includes('instructor')) {
    return copilot
  }
  return ''
}

export const ROLE_COMPANION_NAME_MAX_LENGTH = 17

export function formatRoleCompanionName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) {
    return ''
  }
  if (trimmed.length <= ROLE_COMPANION_NAME_MAX_LENGTH) {
    return trimmed
  }
  return `${trimmed.slice(0, ROLE_COMPANION_NAME_MAX_LENGTH - 3)}...`
}

export function formatRoleCompanionDisplay(
  roles: readonly PilotRole[],
  names: { pilot?: string | null; copilot?: string | null },
): string {
  return formatRoleCompanionName(roleCompanionName(roles, names))
}
