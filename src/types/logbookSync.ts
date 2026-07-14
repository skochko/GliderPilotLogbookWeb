export interface LogbookSyncStatus {
  status: 'idle' | 'syncing' | 'error'
  connected: boolean
  loaded: number
  total: number
  percent: number
  flights_loaded: number
  show_progress: boolean
  last_synced_at: string | null
  error: string
}
