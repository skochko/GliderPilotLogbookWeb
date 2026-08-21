import type { QualificationEvent } from '@/types/qualificationEvents'

export function sortQualificationEventsNewestFirst(
  events: readonly QualificationEvent[],
): QualificationEvent[] {
  return [...events].sort((left, right) => {
    const leftDate = left.date_completed || left.date
    const rightDate = right.date_completed || right.date
    if (!leftDate && !rightDate) return 0
    if (!leftDate) return 1
    if (!rightDate) return -1
    return rightDate.localeCompare(leftDate)
  })
}
