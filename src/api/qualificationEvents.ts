import { apiJson } from './client'
import type { QualificationEvent, QualificationEventTypeOption } from '@/types/qualificationEvents'

export interface QualificationEventsResponse {
  events: QualificationEvent[]
  event_types: string[]
  event_type_options?: QualificationEventTypeOption[]
}

export function getQualificationEvents(): Promise<QualificationEventsResponse> {
  return apiJson<QualificationEventsResponse>('/summary/qualification-events')
}

export function updateQualificationEvents(
  events: QualificationEvent[],
): Promise<QualificationEventsResponse> {
  return apiJson<QualificationEventsResponse>('/summary/qualification-events', {
    method: 'PUT',
    body: JSON.stringify({ events }),
  })
}
