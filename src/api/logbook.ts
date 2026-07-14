import { apiJson } from './client'
import type { LogbookStatus } from '@/types'
import type { LogbookCreateRequest, LogbookCreateResponse } from '@/types/logbookCreate'

export function getLogbookStatus(): Promise<LogbookStatus> {
  return apiJson<LogbookStatus>('/logbook')
}

export function connectLogbook(payload: { spreadsheet_id: string }): Promise<LogbookStatus> {
  return apiJson<LogbookStatus>('/logbook/connect', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createLogbook(payload: LogbookCreateRequest): Promise<LogbookCreateResponse> {
  return apiJson<LogbookCreateResponse>('/logbook/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
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
