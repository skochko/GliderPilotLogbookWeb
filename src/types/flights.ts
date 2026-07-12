import type { Flight } from '@/types'

export interface FlightListResponse {
  results: Flight[]
  total: number
  limit: number
  offset: number
  has_more: boolean
  sort_direction: string
}

export interface FlightListParams {
  limit?: number
  offset?: number
  sort_direction?: string
}
