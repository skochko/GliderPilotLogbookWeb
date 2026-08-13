import { apiJson } from './client'
import type { QualificationSummary, QualificationSummaryPatch } from '@/types/summary'

export function getSummary(
  options: { waitForFresh?: boolean } = {},
): Promise<QualificationSummary> {
  return apiJson<QualificationSummary>(options.waitForFresh ? '/summary?fresh=1' : '/summary')
}

export function updateSummary(payload: QualificationSummaryPatch): Promise<QualificationSummary> {
  return apiJson<QualificationSummary>('/summary', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
