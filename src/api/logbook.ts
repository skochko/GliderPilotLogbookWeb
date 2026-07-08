import { apiJson } from './client'
import type { LogbookStatus } from '@/types'

export function getLogbookStatus(): Promise<LogbookStatus> {
  return apiJson<LogbookStatus>('/logbook')
}

export function connectLogbook(payload: { url?: string; spreadsheet_id?: string }): Promise<LogbookStatus> {
  return apiJson<LogbookStatus>('/logbook/connect', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function disconnectLogbook(): Promise<void> {
  return apiJson<void>('/logbook/disconnect', { method: 'DELETE' })
}
