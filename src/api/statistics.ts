import { apiJson } from './client'
import type { Statistics, StatisticsQuery } from '@/types'

export function getStatistics(query?: StatisticsQuery): Promise<Statistics> {
  if (!query) {
    return apiJson<Statistics>('/statistics')
  }
  const search = new URLSearchParams({
    from: query.from,
    to: query.to,
  })
  return apiJson<Statistics>(`/statistics?${search.toString()}`)
}
