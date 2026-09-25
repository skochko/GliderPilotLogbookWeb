export interface ClubInstructor {
  profile_id: number
  instructor_name: string
  rating: string
  reporting_date: string | null
  activity_period_months: number
  pic_time: string | null
  pic_launches: number | null
  fi_time: string | null
  fi_launches: number | null
  refresher_renewal_date: string | null
  refresher_source: string | null
  demonstration_of_ability_date: string | null
  time_launch_note: string
  refresher_note: string
  activity_report_url: string | null
  data_status: string
  data_status_message: string
  cache_verified_at: string | null
  cache_updated_at: string | null
}

export interface ClubInstructorWarning {
  profile_id: number
  message: string
}

export interface ClubInstructorOverview {
  organization: { id: number; name: string }
  viewer_role: 'cfi' | 'dcfi'
  as_of: string
  instructors: ClubInstructor[]
  warnings: ClubInstructorWarning[]
}

export interface ProfileCapabilities {
  can_view_club_instructor_reports: boolean
}
