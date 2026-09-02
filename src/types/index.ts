import type { components } from './api.generated'
import type {
  DashboardLegalityChip,
  DashboardLegalityGroup,
  DashboardLegalityRow,
  DashboardMedical,
  DashboardQualification,
  DashboardRequirement,
  DashboardStatus,
  DashboardStatusEnum,
  DashboardSummary,
  DashboardSummaryItem,
} from './dashboard'

import type {
  SheetSettingsDateFormatFields,
  SheetSettingsProfileFields,
  SheetSettingsTemplateFields,
} from './settings'

export type UserMe = components['schemas']['UserMe'] & {
  logbook_setup_completed: boolean
  is_demo: boolean
  demo_spreadsheet_url: string
}
export type Flight = components['schemas']['Flight'] & {
  under_instruction: boolean
  media?: readonly import('./flightMedia').FlightMediaItem[]
}
export type {
  FlightMediaDeleteResponse,
  FlightMediaItem,
  FlightMediaFolder,
  FlightMediaUploadResponse,
} from './flightMedia'
export type {
  FlightDatePresetId,
  FlightFilterOptions,
  FlightListFilters,
  FlightListParams,
  FlightListResponse,
  FlightPilotRoleFilter,
  FlightSortBy,
} from './flights'
export type FlightCreateRequest = components['schemas']['FlightCreateRequest'] & {
  under_instruction?: boolean
}
export type FlightPatchRequest = components['schemas']['PatchedFlightPatchRequest'] & {
  under_instruction?: boolean
}
export type LogbookStatus = components['schemas']['LogbookStatus'] & {
  template_engine?: import('./settings').TemplateEngineKey | ''
  template_version?: string
  template_version_name?: string
  template_version_slug?: string
  template_version_raw?: string
  template_version_supported?: boolean
  template_upgrade_available?: string | null
  public_template_copy_url?: string
}
export type SheetSettings = components['schemas']['SheetSettings'] &
  SheetSettingsDateFormatFields &
  SheetSettingsProfileFields &
  SheetSettingsTemplateFields
export type SheetSettingsPatch = components['schemas']['PatchedSheetSettingsPatchRequest'] &
  SheetSettingsProfileFields
export type Statistics = import('./statistics').Statistics
export type { StatisticsQuery } from './statistics'
export type Profile = components['schemas']['Profile']
export type ProfilePatch = components['schemas']['PatchedProfilePatchRequest']
export type Page = components['schemas']['Page']
export type SitePageType = components['schemas']['PageTypeEnum']
export type { LogbookCreateRequest } from './logbookCreate'
export type { DateFormatOption, SheetDisplaySettings, TemplateEngineKey } from './settings'

export type {
  DashboardLegalityChip,
  DashboardLegalityGroup,
  DashboardLegalityRow,
  DashboardMedical,
  DashboardQualification,
  DashboardRequirement,
  DashboardStatus,
  DashboardStatusEnum,
  DashboardSummary,
  DashboardSummaryItem,
}

export interface ApiErrorBody {
  code: string
  message: string
  details: Record<string, unknown> | unknown[]
}

export interface ApiErrorResponse {
  error: ApiErrorBody
}
