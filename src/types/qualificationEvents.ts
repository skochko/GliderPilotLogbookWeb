export const QUALIFICATION_EVENT_TYPES = [
  'First Solo',
  'Other training endorsement',
  'Proficiency check',
  'Training flight FI(s)',
  'BI demonstration',
  'BI Refresher',
  'FI Refresher',
  'FI demonstration (9 Year)',
] as const

export type QualificationEventType = (typeof QUALIFICATION_EVENT_TYPES)[number]

export interface QualificationEvent {
  id?: number
  date: string
  place: string
  event_type: QualificationEventType
  date_completed: string
  remarks: string
}
