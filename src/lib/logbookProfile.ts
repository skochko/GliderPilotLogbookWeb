import type { PilotPrivilege } from '@/types/logbookCreate'
import type { SheetSettingsPatch } from '@/types'
import {
  isInstructorPrivilege,
  PILOT_PRIVILEGE_OPTIONS,
} from '@/lib/logbookCreate'

export { PILOT_PRIVILEGE_OPTIONS, isInstructorPrivilege }

export interface LogbookProfileFormState {
  date_format: string
  sort_direction: string
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
  prior_flight_count: string
  prior_kms_flown: string
  medical_type: string
  medical_issue_date: string
  medical_expire_date: string
  start_date: string
}

export function emptyLogbookProfileForm(): LogbookProfileFormState {
  return {
    date_format: '',
    sort_direction: 'newest_first',
    pilot_name: '',
    pilot_address: '',
    pilot_privilege: 'pilot',
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
    start_date: '',
  }
}

export function buildSettingsPatch(form: LogbookProfileFormState): SheetSettingsPatch {
  const patch: SheetSettingsPatch = {
    date_format: form.date_format,
    sort_direction: form.sort_direction,
    pilot_name: form.pilot_name.trim(),
    pilot_privilege: form.pilot_privilege,
    pilot_address: form.pilot_address.trim(),
    start_date: form.start_date || null,
    instructor_from_date: form.instructor_from_date || null,
    license_type: form.license_type.trim(),
    license_date: form.license_date || null,
    license_number: form.license_number.trim(),
    license_authority: form.license_authority.trim(),
    prior_total_time: form.prior_total_time.trim(),
    prior_pic_time: form.prior_pic_time.trim(),
    prior_p2_time: form.prior_p2_time.trim(),
    prior_instructor_time: form.prior_instructor_time.trim(),
    prior_flight_count: form.prior_flight_count.trim()
      ? Number.parseInt(form.prior_flight_count, 10)
      : 0,
    prior_kms_flown: form.prior_kms_flown.trim(),
    medical_type: form.medical_type.trim(),
    medical_issue_date: form.medical_issue_date || null,
    medical_expire_date: form.medical_expire_date || null,
    bi_ref_date: null,
    fi_3year_date: null,
    fi_ref_date: null,
  }

  if (form.pilot_privilege === 'bi') {
    patch.bi_ref_date = form.bi_ref_date || null
  }
  if (form.pilot_privilege === 'fi') {
    patch.fi_3year_date = form.fi_3year_date || null
    patch.fi_ref_date = form.fi_ref_date || null
  }

  return patch
}
