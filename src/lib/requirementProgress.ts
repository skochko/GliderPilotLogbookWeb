import { formatDurationDisplay, isDurationValue } from './duration'
import type { DashboardStatusEnum } from '@/types'

export interface RequirementProgressInput {
  id?: string
  obtained: string
  required: string
  requirement_type?: string
  lookback_period?: string
  status?: DashboardStatusEnum
}

const BOOLEAN_TYPES = new Set(['boolean', 'proficiency_check'])
const COUNT_TYPES = new Set(['count', 'launch_method', 'training_flight'])

function isBooleanRequirement(input: RequirementProgressInput): boolean {
  if (input.requirement_type && BOOLEAN_TYPES.has(input.requirement_type)) {
    return true
  }
  const required = input.required.trim().toLowerCase()
  const obtained = input.obtained.trim().toLowerCase()
  return required === 'yes' && (obtained === 'yes' || obtained === 'no')
}

function formatLookbackSuffix(lookbackPeriod: string | undefined): string {
  const trimmed = (lookbackPeriod ?? '').trim()
  if (!trimmed) {
    return ''
  }
  return ` in the last ${trimmed}`
}

function countUnit(input: RequirementProgressInput): string {
  if (input.requirement_type === 'training_flight' || input.id?.includes('training')) {
    return 'training flights'
  }
  return 'launches'
}

function formatBooleanProgress(input: RequirementProgressInput): string {
  const obtained = input.obtained.trim().toLowerCase()
  const lookback = formatLookbackSuffix(input.lookback_period)

  if (obtained === 'yes' || input.status === 'current') {
    return 'Recorded'
  }
  return `Not recorded${lookback}`
}

function formatDurationProgress(obtained: string, required: string): string {
  const obtainedLabel = formatDurationDisplay(obtained)
  const requiredLabel = formatDurationDisplay(required)
  if (obtainedLabel === '—' && requiredLabel === '—') {
    return ''
  }
  return `${obtainedLabel} of ${requiredLabel} required`
}

function formatCountProgress(input: RequirementProgressInput): string {
  const obtained = input.obtained.trim() || '0'
  const required = input.required.trim()
  if (!required) {
    return ''
  }
  const unit = countUnit(input)
  return `${obtained} of ${required} ${unit} required`
}

/** Format obtained/required as variant A: "3h of 5h required", "2 of 5 launches required", etc. */
export function formatRequirementProgress(input: RequirementProgressInput): string {
  const obtained = (input.obtained ?? '').trim()
  const required = (input.required ?? '').trim()

  if (!obtained && !required) {
    return ''
  }

  if (isBooleanRequirement(input)) {
    return formatBooleanProgress(input)
  }

  if (isDurationValue(obtained) || isDurationValue(required)) {
    return formatDurationProgress(obtained, required)
  }

  if (
    input.requirement_type &&
    (COUNT_TYPES.has(input.requirement_type) || /^\d+$/.test(obtained) || /^\d+$/.test(required))
  ) {
    return formatCountProgress(input)
  }

  if (/^\d+$/.test(obtained) || /^\d+$/.test(required)) {
    return formatCountProgress(input)
  }

  return ''
}
