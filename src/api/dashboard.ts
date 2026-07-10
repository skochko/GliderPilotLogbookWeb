import { apiJson } from './client'
import type { DashboardStatus } from '@/types'

export function getDashboardStatus(): Promise<DashboardStatus> {
  return apiJson<DashboardStatus>('/dashboard/status')
}
