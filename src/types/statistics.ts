export interface StatisticsPeriodResponse {
  from: string
  to: string
}

export interface RecentActivityItem {
  id: string
  date: string
  glider: string
  registration: string
  launch_type: string
  flight_time: string
  copilot: string
  pilot: string
  pilot_roles: Array<'p1' | 'p2' | 'instructor'>
  remarks: string
}

export type Statistics = {
  total_flights: number
  total_flight_hours: number
  total_pic_hours: number
  total_p2_hours: number
  total_instructor_hours: number
  pic_flights: number
  p2_flights: number
  instructor_flights: number
  solo_flights: number
  solo_landings: number
  solo_hours: number
  total_launches: number
  days_flown: number
  avg_flight_hours: number
  flights_by_month: Array<{ month: string; count: number; hours: number }>
  flights_by_week: Array<{ week: string; count: number; hours: number }>
  flights_by_glider: Array<{ glider: string; count: number; hours: number }>
  flights_by_launch_type: Array<{ launch_type: string; count: number }>
  recent_activity: RecentActivityItem[]
  period?: StatisticsPeriodResponse
}

export interface StatisticsQuery {
  from: string
  to: string
}
