import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ClubInstructorDetailDialog from '@/components/ClubInstructorDetailDialog.vue'
import type {
  ClubInstructor,
  InstructorActivityDetail,
  InstructorActivityMetric,
} from '@/types/instructorOversight'

const metric = (minutes: number, count: number): InstructorActivityMetric => ({
  count,
  minutes,
  launches: count,
  last_date: '2026-10-11',
})

const trainingFlights = {
  obtained: 1,
  required: 1,
  valid_until: '2028-03-30',
  remaining_days: 501,
  is_current: true,
  events: [],
}

const instructor: ClubInstructor = {
  profile_id: 7,
  instructor_name: 'Steve Fletcher',
  rating: 'IFP',
  reporting_date: '2026-08-03',
  activity_period_months: 12,
  activity: {
    period_months: 12,
    time: '35:19',
    launches: 93,
    required_time: '5:00',
    required_launches: 15,
  },
  pic_time: '35:19',
  pic_launches: 93,
  fi_time: null,
  fi_launches: null,
  refresher_renewal_date: '2027-04-01',
  refresher_source: 'refresher',
  demonstration_of_ability_date: null,
  medical_expiry_date: '2028-11-25',
  refresher_note: '',
  training_flights: trainingFlights,
  qualification_status: 'valid',
  issues: [],
  data_status: 'current',
  data_status_message: '',
  cache_verified_at: null,
  cache_updated_at: null,
  activity_report_url: null,
}

const activityDetail: InstructorActivityDetail = {
  pilot_name: 'Steve Fletcher',
  privilege: 'Introductory Flight Pilot',
  reporting_date: '2026-08-03',
  generated_on: '2026-11-15',
  medical: { type: 'Class 2', expiry_date: '2028-11-25', status: 'valid' },
  activity: [
    {
      key: 'pic',
      label: 'PIC (P1)',
      nested: false,
      periods: { '36': metric(8114, 394), '24': metric(5215, 220), '12': metric(2119, 93) },
      last_date: '2026-10-11',
    },
  ],
  events: [],
  training_flights: trainingFlights,
}

function mountDialog(overrides: Partial<ClubInstructor> = {}) {
  return mount(ClubInstructorDetailDialog, {
    attachTo: document.body,
    props: {
      open: true,
      instructor: { ...instructor, ...overrides },
      activityDetail,
      loading: false,
      error: null,
    },
  })
}

describe('ClubInstructorDetailDialog', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('shows only the policy period on phones and every period on wider screens', () => {
    mountDialog()

    const mobile = document.querySelector('[data-testid="activity-mobile"]')!
    expect(mobile.textContent).toContain('35 h 19 min')
    expect(mobile.textContent).toContain('93 flights')
    expect(mobile.textContent).toContain('last 12 months')
    expect(mobile.textContent).not.toContain('135 h 14 min')
    expect(mobile.querySelectorAll('thead th')).toHaveLength(2)

    const desktop = document.querySelector('[data-testid="activity-desktop"]')!
    expect(desktop.textContent).toContain('Last 36 months')
    expect(desktop.textContent).toContain('Last 24 months')
    expect(desktop.textContent).toContain('Last 12 months')
  })

  it('falls back to 36 months on phones when no policy period is set', () => {
    mountDialog({ activity_period_months: null })

    const mobile = document.querySelector('[data-testid="activity-mobile"]')!
    expect(mobile.textContent).toContain('135 h 14 min')
    expect(mobile.textContent).toContain('last 36 months')
  })
})
