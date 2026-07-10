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

export type UserMe = components['schemas']['UserMe']
export type Flight = components['schemas']['Flight']
export type FlightCreateRequest = components['schemas']['FlightCreateRequest']
export type FlightPatchRequest = components['schemas']['PatchedFlightPatchRequest']
export type LogbookStatus = components['schemas']['LogbookStatus']
export type SheetSettings = components['schemas']['SheetSettings']
export type SheetSettingsPatch = components['schemas']['PatchedSheetSettingsPatchRequest']
export type Summary = components['schemas']['Summary']
export type SummaryPatch = components['schemas']['PatchedSummaryPatchRequest']
export type MedicalBlock = components['schemas']['MedicalBlock']
export type MedicalEntry = components['schemas']['MedicalEntry']
export type Statistics = components['schemas']['Statistics']
export type Profile = components['schemas']['Profile']
export type ProfilePatch = components['schemas']['PatchedProfilePatchRequest']
export type Page = components['schemas']['Page']
export type SitePageType = components['schemas']['PageTypeEnum']

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
