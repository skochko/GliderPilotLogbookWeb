import { describe, expect, it } from 'vitest'
import {
  applySheetSettingsToCreateForm,
  buildLogbookCreatePayload,
  createFormHasProfileData,
} from '../logbookCreate'
import { defaultLogbookCreateForm } from '@/types/logbookCreate'
import type { SheetSettings } from '@/types'

describe('applySheetSettingsToCreateForm', () => {
  it('maps sheet settings into the create wizard form', () => {
    const form = defaultLogbookCreateForm()
    const settings = {
      date_format: 'd/m/yyyy',
      sort_direction: 'newest_first',
      pilot_name: 'Alice',
      pilot_address: 'Berlin',
      pilot_privilege: 'fi',
      instructor_from_date: '2020-01-01',
      fi_3year_date: '2024-06-01',
      fi_ref_date: '2024-07-01',
      license_type: 'SPL',
      license_date: '2019-05-01',
      license_number: 'DE-1',
      license_authority: 'LBA',
      prior_total_time: '10:30',
      prior_pic_time: '8:00',
      prior_p2_time: '2:30',
      prior_instructor_time: '1:00',
      prior_flight_count: 42,
      prior_kms_flown: '1500',
      medical_type: 'Class 2',
      medical_issue_date: '2024-01-01',
      medical_expire_date: '2026-01-01',
      is_instructor: true,
      zebra_color: '#fff',
      header_color: '#000',
    } satisfies SheetSettings

    applySheetSettingsToCreateForm(form, settings)

    expect(form.pilot_name).toBe('Alice')
    expect(form.pilot_privilege).toBe('fi')
    expect(form.license_number).toBe('DE-1')
    expect(form.prior_flight_count).toBe('42')
    expect(form.medical_type).toBe('Class 2')
    expect(createFormHasProfileData(form)).toBe(true)
  })
})

describe('buildLogbookCreatePayload', () => {
  it('builds personal fields and nulls skipped sections', () => {
    const form = defaultLogbookCreateForm()
    form.pilot_name = 'Alice'
    form.pilot_privilege = 'fi'
    form.fi_3year_date = '2024-06-01'

    const payload = buildLogbookCreatePayload(form, {
      skippedLicense: true,
      skippedTotals: true,
      skippedMedical: true,
      skippedClubAutomation: true,
      organizationId: null,
    })

    expect(payload).toEqual({
      pilot_name: 'Alice',
      pilot_privilege: 'fi',
      fi_3year_date: '2024-06-01',
      license: null,
      prior_totals: null,
      medical: null,
    })
  })

  it('includes medical when not skipped', () => {
    const form = defaultLogbookCreateForm()
    form.pilot_name = 'Bob'
    form.medical_type = 'Class 2'
    form.medical_issue_date = '2024-01-01'
    form.medical_expire_date = '2026-01-01'

    const payload = buildLogbookCreatePayload(form, {
      skippedLicense: true,
      skippedTotals: true,
      skippedMedical: false,
      skippedClubAutomation: true,
      organizationId: null,
    })

    expect(payload.medical).toEqual({
      type: 'Class 2',
      issue_date: '2024-01-01',
      expire_date: '2026-01-01',
    })
  })

  it('includes organization_id when club automation is not skipped', () => {
    const form = defaultLogbookCreateForm()
    form.pilot_name = 'Carol'

    const payload = buildLogbookCreatePayload(form, {
      skippedLicense: true,
      skippedTotals: true,
      skippedMedical: true,
      skippedClubAutomation: false,
      organizationId: 42,
    })

    expect(payload.organization_id).toBe(42)
  })

  it('accepts numeric prior_flight_count from number inputs', () => {
    const form = defaultLogbookCreateForm()
    form.pilot_name = 'Dave'
    form.prior_flight_count = 12

    const payload = buildLogbookCreatePayload(form, {
      skippedLicense: true,
      skippedTotals: false,
      skippedMedical: true,
      skippedClubAutomation: true,
      organizationId: null,
    })

    expect(payload.prior_totals?.flight_count).toBe(12)
  })
})
