import type {
  LogbookCreateFormState,
  LogbookCreateRequest,
  PilotPrivilege,
} from '@/types/logbookCreate'

export const PILOT_PRIVILEGE_OPTIONS: { value: PilotPrivilege; label: string }[] = [
  { value: 'pilot', label: 'Pilot' },
  { value: 'bi', label: 'Basic instructor (BI)' },
  { value: 'fi', label: 'Flight instructor (FI)' },
]

export function isInstructorPrivilege(privilege: PilotPrivilege): boolean {
  return privilege === 'bi' || privilege === 'fi'
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
    const flightCount = form.prior_flight_count.trim()
    payload.prior_totals = {
      total_time: form.prior_total_time.trim(),
      pic_time: form.prior_pic_time.trim(),
      p2_time: form.prior_p2_time.trim(),
      instructor_time: form.prior_instructor_time.trim(),
      flight_count: flightCount ? Number.parseInt(flightCount, 10) : null,
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
