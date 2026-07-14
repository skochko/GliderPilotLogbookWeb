import { apiJson } from './client'
import type { LogbookSyncStatus } from '@/types/logbookSync'

export function getLogbookSyncStatus(): Promise<LogbookSyncStatus> {
  return apiJson<LogbookSyncStatus>('/logbook/sync-status')
}
