import { apiJson } from './client'
import type { QualificationEvent } from '@/types/qualificationEvents'

export interface QualificationEventsResponse {
  events: QualificationEvent[]
  event_types: string[]
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
