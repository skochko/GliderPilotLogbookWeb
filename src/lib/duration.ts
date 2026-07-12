const DURATION_PATTERN = /^(\d{1,3}):(\d{2})(?::(\d{2}))?$/

function parseDurationParts(value: string | null | undefined): { hours: number; minutes: number; seconds: number } | null {
  const trimmed = (value ?? '').trim()
  if (!trimmed) {
    return null
  }
  const match = trimmed.match(DURATION_PATTERN)
  if (!match) {
    return null
  }
  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
    seconds: Number(match[3] ?? '0'),
  }
}

/** Parse H:MM or H:MM:SS duration strings to fractional hours. */
export function parseDurationHours(value: string | null | undefined): number {
  const parts = parseDurationParts(value)
  if (!parts) {
    const trimmed = (value ?? '').trim()
    if (!trimmed) {
      return 0
    }
    const numeric = Number(trimmed.replace(',', '.'))
    return Number.isFinite(numeric) ? numeric : 0
  }
  return parts.hours + parts.minutes / 60 + parts.seconds / 3600
}

export function isDurationValue(value: string | null | undefined): boolean {
  return DURATION_PATTERN.test((value ?? '').trim())
}

/** Format logbook duration strings (H:MM or H:MM:SS) for display, e.g. 05:00 → 5h. */
export function formatDurationDisplay(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  if (!trimmed) {
    return '—'
  }

  const match = trimmed.match(DURATION_PATTERN)
  if (!match) {
    return trimmed
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3] ?? '0')

  if (hours === 0 && minutes === 0 && seconds === 0) {
    return '0h'
  }

  const roundedMinutes = minutes + (seconds >= 30 ? 1 : 0)
  const totalHours = hours + Math.floor(roundedMinutes / 60)
  const remainingMinutes = roundedMinutes % 60

  if (totalHours > 0 && remainingMinutes > 0) {
    return `${totalHours}h ${remainingMinutes}m`
  }
  if (totalHours > 0) {
    return `${totalHours}h`
  }
  return `${remainingMinutes}m`
}

/** Human-readable duration for detail views, e.g. 1:00 → "1 min", 1:30 → "1 h 30 min". */
export function formatDurationProse(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  if (!trimmed) {
    return '—'
  }

  const match = trimmed.match(DURATION_PATTERN)
  if (!match) {
    return trimmed
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3] ?? '0')

  if (hours === 0 && minutes === 0 && seconds === 0) {
    return '0 min'
  }

  const roundedMinutes = minutes + (seconds >= 30 ? 1 : 0)
  const totalHours = hours + Math.floor(roundedMinutes / 60)
  const remainingMinutes = roundedMinutes % 60

  if (totalHours > 0 && remainingMinutes > 0) {
    return `${totalHours} h ${remainingMinutes} min`
  }
  if (totalHours > 0) {
    return `${totalHours} h`
  }
  if (remainingMinutes === 1) {
    return '1 min'
  }
  return `${remainingMinutes} min`
}

export function hasDurationValue(value: string | null | undefined): boolean {
  const trimmed = (value ?? '').trim()
  if (!trimmed) {
    return false
  }
  if (!isDurationValue(trimmed)) {
    return true
  }
  return parseDurationHours(trimmed) > 0
}

export function splitDurationDisplay(value: string | null | undefined): {
  primary: string
  secondary: string | null
} {
  const display = formatDurationDisplay(value)
  if (display === '—') {
    return { primary: display, secondary: null }
  }

  const match = display.match(/^(\d+h)\s+(\d+m)$/)
  if (match) {
    return { primary: match[1]!, secondary: match[2]! }
  }

  return { primary: display, secondary: null }
}

/** Format decimal flight hours from statistics, e.g. 3.5 → 3h 30m. */
export function formatDecimalHours(hours: number | null | undefined): string {
  if (hours == null || hours <= 0) {
    return '0h'
  }

  const totalMinutes = Math.round(hours * 60)
  const wholeHours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (wholeHours > 0 && minutes > 0) {
    return `${wholeHours}h ${minutes}m`
  }
  if (wholeHours > 0) {
    return `${wholeHours}h`
  }
  return `${minutes}m`
}

/** Format obtained/required pair for tooltips and tables. */
export function formatRequirementValue(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  if (!trimmed) {
    return '—'
  }
  return formatDurationDisplay(trimmed)
}
