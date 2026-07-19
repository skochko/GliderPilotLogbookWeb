import type { Flight } from '@/types'

export type FlightSortBy = 'date' | 'flight_time'

export type FlightDatePresetId =
  | 'all_time'
  | 'this_month'
  | 'last_month'
  | 'last_90_days'
  | 'year_to_date'
  | 'custom'

export type FlightPilotRoleFilter = '' | 'p1' | 'p2' | 'instructor'

export interface FlightListFilters {
  glider?: string
  registration?: string
  launch_type?: string
  role?: FlightPilotRoleFilter
  date_preset?: FlightDatePresetId
  date_from?: string
  date_to?: string
}

export interface FlightFilterOptions {
  gliders: readonly string[]
  registrations: readonly string[]
  launch_types: readonly string[]
}

export interface FlightListResponse {
  results: Flight[]
  total: number
  limit: number
  offset: number
  has_more: boolean
  sort_direction: string
  sort_by: FlightSortBy
  filters: {
    glider: string | null
    registration: string | null
    launch_type: string | null
    role: string | null
    date_from: string | null
    date_to: string | null
  }
  filter_options: FlightFilterOptions
}

export interface FlightListParams {
  limit?: number
  offset?: number
  sort_direction?: string
  sort_by?: FlightSortBy
  glider?: string
  registration?: string
  launch_type?: string
  role?: string
  from?: string
  to?: string
}
