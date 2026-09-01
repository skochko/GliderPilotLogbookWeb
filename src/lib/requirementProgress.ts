import { formatDurationDisplay, isDurationValue } from './duration'
import type { DashboardStatusEnum } from '@/types'

export interface RequirementProgressInput {
  id?: string
  obtained: string
  required: string
  requirement_type?: string
  lookback_period?: string
  status?: DashboardStatusEnum
  remaining_days?: number | null
}

const BOOLEAN_TYPES = new Set(['boolean', 'proficiency_check'])
const COUNT_TYPES = new Set(['count', 'launch_method', 'training_flight'])
const DATE_TYPES = new Set(['date', 'validity'])

function isDateRequirement(input: RequirementProgressInput): boolean {
  if (input.requirement_type && DATE_TYPES.has(input.requirement_type)) {
    return true
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(input.obtained.trim())
}

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
    if (input.remaining_days === 0) {
      return 'Recorded · expires today'
    }
    if (input.remaining_days != null && input.remaining_days > 0) {
      if (input.remaining_days > 365) {
        const years = Math.floor(input.remaining_days / 365)
        const remainingDays = input.remaining_days % 365
        const yearLabel = years === 1 ? 'year' : 'years'
        const yearPart = `${years} ${yearLabel}`
        if (remainingDays === 0) {
          return `Recorded · ${yearPart} remaining`
        }
        const dayLabel = remainingDays === 1 ? 'day' : 'days'
        return `Recorded · ${yearPart} ${remainingDays} ${dayLabel} remaining`
      }
      const unitLabel = input.remaining_days === 1 ? 'day' : 'days'
      return `Recorded · ${input.remaining_days} ${unitLabel} remaining`
    }
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
  const progress = `${obtained} of ${required} ${unit} required`
  if (input.requirement_type !== 'training_flight' || input.remaining_days == null) {
    return progress
  }
  if (input.remaining_days === 0) {
    return `${progress} · expires today`
  }
  if (input.remaining_days > 0) {
    const unitLabel = input.remaining_days === 1 ? 'day' : 'days'
    return `${progress} · ${input.remaining_days} ${unitLabel} remaining`
  }
  const elapsed = Math.abs(input.remaining_days)
  const unitLabel = elapsed === 1 ? 'day' : 'days'
  return `${progress} · expired ${elapsed} ${unitLabel} ago`
}

function formatDateProgress(input: RequirementProgressInput): string {
  const obtained = input.obtained.trim()
  const lookback = formatLookbackSuffix(input.lookback_period)

  if (!obtained) {
    return `Not recorded${lookback}`
  }
  if (input.status === 'current' || input.status === 'expiring_soon') {
    return `Recorded on ${obtained}`
  }
  return `Last recorded ${obtained}${lookback}`
}

/** Format obtained/required as variant A: "3h of 5h required", "2 of 5 launches required", etc. */
export function formatRequirementProgress(input: RequirementProgressInput): string {
  const obtained = (input.obtained ?? '').trim()
  const required = (input.required ?? '').trim()

  if (!obtained && !required) {
    return ''
  }

  if (isDateRequirement(input)) {
    return formatDateProgress(input)
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
