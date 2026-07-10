export type DashboardStatusEnum = 'current' | 'expiring_soon' | 'expired' | 'unknown'

export interface DashboardRequirement {
  id: string
  title: string
  label?: string
  status: DashboardStatusEnum
  obtained: string
  required: string
  requirement_type?: string
  lookback_period?: string
  message?: string | null
}

export interface DashboardSummaryItem {
  id: string
  label: string
  status: DashboardStatusEnum
  status_text: string
  obtained: string
  required: string
}

export interface DashboardMedical {
  type: string
  status: DashboardStatusEnum
  status_text: string
  issue_date: string
  expiry_date: string
  remaining_days?: number | null
  notes?: string
}

export interface DashboardQualification {
  id: string
  title: string
  regulation: string
  status: DashboardStatusEnum
  status_text: string
  summary: string
  valid_until: string
  remaining_days?: number | null
  summary_items?: DashboardSummaryItem[]
  requirements: DashboardRequirement[]
}

export interface DashboardLegalityRow {
  id: string
  label: string
  status: DashboardStatusEnum
  status_text: string
  obtained: string
  required: string
  requirement_type?: string
  lookback_period?: string
  requirements: DashboardRequirement[]
}

export interface DashboardLegalityChip {
  id: string
  label: string
  status: DashboardStatusEnum
  status_text: string
  obtained: string
  required: string
  requirement_type?: string
  lookback_period?: string
  requirements: DashboardRequirement[]
}

export interface DashboardLegalityGroup {
  id: string
  title: string
  rows: DashboardLegalityRow[]
  chip_section_title: string
  chips: DashboardLegalityChip[]
}

export interface DashboardStatus {
  medical: DashboardMedical[]
  qualifications: DashboardQualification[]
  legality_groups?: DashboardLegalityGroup[]
}

export interface DashboardSummaryTotals {
  time?: string
  pic?: string
  p2?: string
  instructor?: string
  landings?: string
  kms_flown?: string
}

export interface DashboardSummaryTotalsByDate extends DashboardSummaryTotals {
  start_date?: string
  end_date?: string
}

export interface DashboardSummarySoloFcn {
  solo_time: string
  solo_count: string
  fcn_time: string
  fcn_count: string
}

export interface DashboardSummary {
  available: boolean
  show_instructor_columns: boolean
  totals: DashboardSummaryTotals
  totals_by_date: DashboardSummaryTotalsByDate
  solo_fcn: DashboardSummarySoloFcn
}
