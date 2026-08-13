import type { SheetSettingsPatch } from '@/types'
import type { SettingsTemplateFactory } from './types'
import { editableFields } from './types'

const LEGACY_FIELDS: readonly (keyof SheetSettingsPatch)[] = [
  'date_format',
  'sort_direction',
  'pilot_name',
  'pilot_address',
  'pilot_privilege',
  'start_date',
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
  'prior_pic_flight_count',
  'prior_p2_time',
  'prior_p2_flight_count',
  'prior_instructor_time',
  'prior_instructor_flight_count',
  'prior_flight_count',
  'prior_kms_flown',
  'medical_type',
  'medical_issue_date',
  'medical_expire_date',
]

export const createLegacySettingsAdapter: SettingsTemplateFactory = (settings) => {
  const editable = editableFields(settings, LEGACY_FIELDS)

  return {
    key: 'legacy',
    title: 'Settings',
    description: 'Edit your logbook profile and sheet preferences.',
    canEdit: (field) => editable.has(field),
    shows: (section) => {
      if (section === 'displayPreferences')
        return settings.capabilities?.display_preferences ?? true
      if (section === 'medical') return settings.capabilities?.medical_settings ?? true
      if (section === 'summaryDates') return settings.capabilities?.summary_dates ?? true
      return editable.has('start_date')
    },
  }
}
