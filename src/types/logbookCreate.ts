export type PilotPrivilege = string

export interface LogbookCreateLicense {
  type?: string
  date?: string
  number?: string
  authority?: string
}

export interface LogbookCreatePriorTotals {
  total_time?: string
  pic_time?: string
  p2_time?: string
  instructor_time?: string
  flight_count?: number | null
  kms_flown?: string
}

export interface LogbookCreateMedical {
  type?: string
  issue_date?: string
  expire_date?: string
}

export interface LogbookCreateRequest {
  pilot_name: string
  pilot_address?: string
  pilot_privilege?: PilotPrivilege
  instructor_from_date?: string
  bi_ref_date?: string
  fi_3year_date?: string
  fi_ref_date?: string
  license?: LogbookCreateLicense | null
  prior_totals?: LogbookCreatePriorTotals | null
  medical?: LogbookCreateMedical | null
  organization_id?: number | null
}

export interface ClubAutomationRequestSummary {
  id: number
  organization_name: string
  status: string
  message: string
}

export interface LogbookCreateResponse {
  connected: boolean
  spreadsheet_id: string
  title: string
  sheets: string[]
  template_version?: string
  template_version_name?: string
  template_version_slug?: string
  template_version_raw?: string
  template_version_supported?: boolean
  template_upgrade_available?: string | null
  public_template_copy_url?: string
  club_automation_request?: ClubAutomationRequestSummary | null
}

export interface LogbookCreateFormState {
  pilot_name: string
  pilot_address: string
  pilot_privilege: PilotPrivilege
  instructor_from_date: string
  bi_ref_date: string
  fi_3year_date: string
  fi_ref_date: string
  license_type: string
  license_date: string
  license_number: string
  license_authority: string
  prior_total_time: string
  prior_pic_time: string
  prior_p2_time: string
  prior_instructor_time: string
  prior_flight_count: string | number
  prior_kms_flown: string
  medical_type: string
  medical_issue_date: string
  medical_expire_date: string
}

export const defaultLogbookCreateForm = (): LogbookCreateFormState => ({
  pilot_name: '',
  pilot_address: '',
  pilot_privilege: 'SPL Pilot',
  instructor_from_date: '',
  bi_ref_date: '',
  fi_3year_date: '',
  fi_ref_date: '',
  license_type: '',
  license_date: '',
  license_number: '',
  license_authority: '',
  prior_total_time: '',
  prior_pic_time: '',
  prior_p2_time: '',
  prior_instructor_time: '',
  prior_flight_count: '',
  prior_kms_flown: '',
  medical_type: '',
  medical_issue_date: '',
  medical_expire_date: '',
})
