export const DEFAULT_QUALIFICATION_EVENT_TYPES = [
  'First Solo',
  'Other training endorsement',
  'Proficiency check',
  'Training flight FI(s)',
  'BI demonstration',
  'BI Refresher',
  'FI Refresher',
  'FI demonstration (9 Year)',
] as const

export interface QualificationEvent {
  id?: number
  date: string
  place: string
  event_type: string
  date_completed: string
  remarks: string
}
