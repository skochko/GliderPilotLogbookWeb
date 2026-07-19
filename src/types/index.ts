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

import type { SheetSettingsDateFormatFields, SheetSettingsProfileFields } from './settings'

export type UserMe = components['schemas']['UserMe']
export type Flight = components['schemas']['Flight'] & {
  media?: readonly import('./flightMedia').FlightMediaItem[]
}
export type { FlightMediaItem, FlightMediaFolder, FlightMediaUploadResponse } from './flightMedia'
export type { FlightDatePresetId, FlightFilterOptions, FlightListFilters, FlightListParams, FlightListResponse, FlightPilotRoleFilter, FlightSortBy } from './flights'
export type FlightCreateRequest = components['schemas']['FlightCreateRequest']
export type FlightPatchRequest = components['schemas']['PatchedFlightPatchRequest']
export type LogbookStatus = components['schemas']['LogbookStatus']
export type SheetSettings = components['schemas']['SheetSettings'] &
  SheetSettingsDateFormatFields &
  SheetSettingsProfileFields
export type SheetSettingsPatch = components['schemas']['PatchedSheetSettingsPatchRequest'] &
  SheetSettingsProfileFields
export type Statistics = import('./statistics').Statistics
export type { StatisticsQuery } from './statistics'
export type Profile = components['schemas']['Profile']
export type ProfilePatch = components['schemas']['PatchedProfilePatchRequest']
export type Page = components['schemas']['Page']
export type SitePageType = components['schemas']['PageTypeEnum']
export type { LogbookCreateRequest } from './logbookCreate'
export type { DateFormatOption, SheetDisplaySettings } from './settings'

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
