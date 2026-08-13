import type { SheetSettingsPatch } from '@/types'
import type { SettingsTemplateFactory } from './types'
import { editableFields } from './types'

const V3_FIELDS: readonly (keyof SheetSettingsPatch)[] = [
  'pilot_name',
  'pilot_address',
  'pilot_privilege',
  'instructor_from_date',
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
]

export const createV3SettingsAdapter: SettingsTemplateFactory = (settings) => {
  const editable = editableFields(settings, V3_FIELDS)

  return {
    key: 'v3',
    title: 'Pilot settings',
    description: 'Edit the pilot profile used by the v3 logbook template.',
    canEdit: (field) => editable.has(field),
    shows: () => false,
  }
}
