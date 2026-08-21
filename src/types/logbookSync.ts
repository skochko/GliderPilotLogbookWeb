export interface LogbookSyncStatus {
  status: 'idle' | 'syncing' | 'error'
  connected: boolean
  loaded: number
  total: number
  percent: number
  flights_loaded: number
  show_progress: boolean
  last_source_checked_at: string | null
  last_synced_at: string | null
  error: string
}
