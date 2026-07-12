export interface DateFormatOption {
  value: string
  label: string
}

export interface SheetSettingsDateFormatFields {
  date_format: string
  date_format_strftime?: string
  date_format_options?: DateFormatOption[]
}

export interface SheetDisplaySettings {
  sort_direction: string
  zebra_color: string
  header_color: string
}

export type PilotPrivilege = 'pilot' | 'bi' | 'fi'

export interface SheetSettingsProfileFields {
  pilot_address?: string
  bi_ref_date?: string | null
  fi_3year_date?: string | null
  fi_ref_date?: string | null
  license_type?: string
  license_date?: string | null
  license_number?: string
  license_authority?: string
  prior_total_time?: string
  prior_pic_time?: string
  prior_p2_time?: string
  prior_instructor_time?: string
  prior_flight_count?: number
  prior_kms_flown?: string
  medical_type?: string
  medical_issue_date?: string | null
  medical_expire_date?: string | null
  pilot_privilege?: PilotPrivilege
}

export type SheetSettingsProfilePatch = Partial<SheetSettingsProfileFields>
