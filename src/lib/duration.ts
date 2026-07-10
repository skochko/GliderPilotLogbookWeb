const DURATION_PATTERN = /^(\d{1,3}):(\d{2})(?::(\d{2}))?$/

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
