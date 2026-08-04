import { apiJson } from './client'
import type { LogbookStatus } from '@/types'
import type {
  ClubAutomationRequestSummary,
  LogbookCreationJob,
  LogbookCreateRequest,
  LogbookCreateResponse,
} from '@/types/logbookCreate'

export function getLogbookStatus(): Promise<LogbookStatus> {
  return apiJson<LogbookStatus>('/logbook')
}

export function connectLogbook(payload: { spreadsheet_id: string }): Promise<LogbookStatus> {
  return apiJson<LogbookStatus>('/logbook/connect', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createLogbook(payload: LogbookCreateRequest): Promise<LogbookCreationJob> {
  return apiJson<LogbookCreationJob>('/logbook/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getLogbookCreationStatus(jobId: string): Promise<LogbookCreationJob> {
  return apiJson<LogbookCreationJob>(`/logbook/create-status/${encodeURIComponent(jobId)}`)
}

export interface ClubLinkContext {
  organization_id: number
  name: string
  slug: string
  website_url: string
  is_active: boolean
}

export function getClubLinkContext(token: string): Promise<ClubLinkContext> {
  return apiJson<ClubLinkContext>(`/logbook/club-links/${encodeURIComponent(token)}`)
}

export function requestClubLinkAutomation(
  token: string,
  payload: { consent: boolean; pilot_name?: string },
): Promise<ClubAutomationRequestSummary> {
  return apiJson<ClubAutomationRequestSummary>(
    `/logbook/club-links/${encodeURIComponent(token)}/request`,
    { method: 'POST', body: JSON.stringify(payload) },
  )
}

export function applyLogbookWizard(payload: LogbookCreateRequest): Promise<LogbookCreateResponse> {
  return apiJson<LogbookCreateResponse>('/logbook/wizard/apply', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function disconnectLogbook(): Promise<void> {
  return apiJson<void>('/logbook/disconnect', { method: 'DELETE' })
}
