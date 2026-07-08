import { apiJson } from './client'
import type { MedicalBlock, Summary, SummaryPatch } from '@/types'

export function getSummary(): Promise<Summary> {
  return apiJson<Summary>('/summary')
}

export function updateSummary(payload: SummaryPatch): Promise<Summary> {
  return apiJson<Summary>('/summary', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getMedical(): Promise<MedicalBlock> {
  return apiJson<MedicalBlock>('/summary/medical')
}

export function updateMedical(payload: MedicalBlock): Promise<MedicalBlock> {
  return apiJson<MedicalBlock>('/summary/medical', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
