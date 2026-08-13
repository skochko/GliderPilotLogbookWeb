import { apiJson } from './client'
import type { QualificationEvent } from '@/types/qualificationEvents'

export function getQualificationEvents(): Promise<{ events: QualificationEvent[] }> {
  return apiJson<{ events: QualificationEvent[] }>('/summary/qualification-events')
}

export function updateQualificationEvents(
  events: QualificationEvent[],
): Promise<{ events: QualificationEvent[] }> {
  return apiJson<{ events: QualificationEvent[] }>('/summary/qualification-events', {
    method: 'PUT',
    body: JSON.stringify({ events }),
  })
}
