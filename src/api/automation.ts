import { apiJson } from './client'

export interface AutomationRequest {
  id: number
  organization_id: number
  organization_name: string
  status: AutomationRequestStatus
  pilot_name: string
  pilot_email: string
  logbook_title: string
  logbook_url: string
  created_at: string
  updated_at: string
}

export type AutomationRequestStatus =
  | 'pending'
  | 'in_progress'
  | 'approved'
  | 'rejected'
  | 'completed'

export interface AutomationRequestCreatePayload {
  organization_id: number
  pilot_name?: string
}

export function listAutomationRequests(): Promise<AutomationRequest[]> {
  return apiJson<AutomationRequest[]>('/automation/requests')
}

export function createAutomationRequest(
  payload: AutomationRequestCreatePayload,
): Promise<AutomationRequest> {
  return apiJson<AutomationRequest>('/automation/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
