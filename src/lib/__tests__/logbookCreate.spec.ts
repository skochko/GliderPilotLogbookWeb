import { describe, expect, it } from 'vitest'
import { buildLogbookCreatePayload } from '../logbookCreate'
import { defaultLogbookCreateForm } from '@/types/logbookCreate'

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
