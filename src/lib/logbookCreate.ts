import type { SheetSettings } from '@/types'
import type {
  LogbookCreateFormState,
  LogbookCreateRequest,
  PilotPrivilege,
} from '@/types/logbookCreate'
import { applySheetSettingsToLogbookProfileForm, emptyLogbookProfileForm } from '@/lib/logbookProfile'

export const PILOT_PRIVILEGE_OPTIONS: { value: PilotPrivilege; label: string }[] = [
  { value: 'pilot', label: 'Pilot' },
  { value: 'bi', label: 'Basic instructor (BI)' },
  { value: 'fi', label: 'Flight instructor (FI)' },
]

export function isInstructorPrivilege(privilege: PilotPrivilege): boolean {
  return privilege === 'bi' || privilege === 'fi'
}

const CREATE_FORM_FIELDS = [
  'pilot_name',
  'pilot_address',
  'pilot_privilege',
  'instructor_from_date',
  'bi_ref_date',
  'fi_3year_date',
  'fi_ref_date',
  'license_type',
  'license_date',
  'license_number',
  'license_authority',
  'prior_total_time',
  'prior_pic_time',
  'prior_p2_time',
  'prior_instructor_time',
  'prior_flight_count',
  'prior_kms_flown',
  'medical_type',
  'medical_issue_date',
  'medical_expire_date',
] as const satisfies readonly (keyof LogbookCreateFormState)[]

export function applySheetSettingsToCreateForm(
  form: LogbookCreateFormState,
  settings: SheetSettings,
): void {
  const profileForm = emptyLogbookProfileForm()
  applySheetSettingsToLogbookProfileForm(profileForm, settings)
  for (const field of CREATE_FORM_FIELDS) {
    form[field] = profileForm[field]
  }
}

export function createFormHasProfileData(form: LogbookCreateFormState): boolean {
  return CREATE_FORM_FIELDS.some((field) => {
    const value = form[field]
    if (typeof value === 'number') return Number.isFinite(value)
    return String(value).trim() !== ''
  })
}

export function parseOptionalFlightCount(value: string | number): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : null
  }
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export function buildLogbookCreatePayload(
  form: LogbookCreateFormState,
  options: {
    skippedLicense: boolean
    skippedTotals: boolean
    skippedMedical: boolean
    skippedClubAutomation: boolean
    organizationId: number | null
  },
): LogbookCreateRequest {
  const payload: LogbookCreateRequest = {
    pilot_name: form.pilot_name.trim(),
    pilot_privilege: form.pilot_privilege,
  }

  if (form.pilot_address.trim()) {
    payload.pilot_address = form.pilot_address.trim()
  }
  if (form.instructor_from_date) {
    payload.instructor_from_date = form.instructor_from_date
  }
  if (form.pilot_privilege === 'bi' && form.bi_ref_date) {
    payload.bi_ref_date = form.bi_ref_date
  }
  if (form.pilot_privilege === 'fi') {
    if (form.fi_3year_date) payload.fi_3year_date = form.fi_3year_date
    if (form.fi_ref_date) payload.fi_ref_date = form.fi_ref_date
  }

  if (options.skippedLicense) {
    payload.license = null
  } else {
    payload.license = {
      type: form.license_type.trim(),
      date: form.license_date,
      number: form.license_number.trim(),
      authority: form.license_authority.trim(),
    }
  }

  if (options.skippedTotals) {
    payload.prior_totals = null
  } else {
    const flightCount = parseOptionalFlightCount(form.prior_flight_count)
    payload.prior_totals = {
      total_time: form.prior_total_time.trim(),
      pic_time: form.prior_pic_time.trim(),
      p2_time: form.prior_p2_time.trim(),
      instructor_time: form.prior_instructor_time.trim(),
      flight_count: flightCount,
      kms_flown: form.prior_kms_flown.trim(),
    }
  }

  if (options.skippedMedical) {
    payload.medical = null
  } else {
    payload.medical = {
      type: form.medical_type.trim(),
      issue_date: form.medical_issue_date,
      expire_date: form.medical_expire_date,
    }
  }

  if (!options.skippedClubAutomation && options.organizationId != null) {
    payload.organization_id = options.organizationId
  }

  return payload
}
