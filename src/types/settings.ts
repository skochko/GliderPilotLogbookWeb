export interface DateFormatOption {
  value: string
  label: string
}

export type TemplateEngineKey = 'legacy' | 'v3'

export interface SheetSettingsDateFormatFields {
  date_format: string
  date_format_strftime?: string
  date_format_options?: DateFormatOption[]
}

export interface SheetSettingsTemplateFields {
  template_version?: string
  template_version_name?: string
  template_version_slug?: string
  template_version_raw?: string
  template_engine?: TemplateEngineKey | string
  capabilities?: SettingsCapabilities
}

export interface SettingsCapabilities {
  editable_fields: string[]
  display_preferences: boolean
  medical_settings: boolean
  summary_dates: boolean
}

export interface SheetDisplaySettings {
  sort_direction: string
  zebra_color: string
  header_color: string
  pilot_name: string
}

export type PilotPrivilege = string

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
  prior_pic_flight_count?: string | number
  prior_p2_time?: string
  prior_p2_flight_count?: string | number
  prior_instructor_time?: string
  prior_instructor_flight_count?: string | number
  prior_flight_count?: number | string
  prior_kms_flown?: string
  medical_type?: string
  medical_issue_date?: string | null
  medical_expire_date?: string | null
  pilot_privilege?: PilotPrivilege
}

export type SheetSettingsProfilePatch = Partial<SheetSettingsProfileFields>
