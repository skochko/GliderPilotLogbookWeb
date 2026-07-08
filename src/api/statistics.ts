import { apiJson } from './client'
import type { Statistics } from '@/types'

export function getStatistics(): Promise<Statistics> {
  return apiJson<Statistics>('/statistics')
}
