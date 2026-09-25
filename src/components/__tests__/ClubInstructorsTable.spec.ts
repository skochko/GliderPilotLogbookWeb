import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ClubInstructorsTable from '@/components/ClubInstructorsTable.vue'
import type { ClubInstructor } from '@/types/instructorOversight'

const instructor: ClubInstructor = {
  profile_id: 42,
  instructor_name: 'Rick Wiles',
  rating: 'FI(S)',
  reporting_date: '2026-09-01',
  activity_period_months: 36,
  pic_time: '154:31',
  pic_launches: 1200,
  fi_time: '117:22',
  fi_launches: 1022,
  refresher_renewal_date: '2028-02-01',
  refresher_source: 'refresher',
  demonstration_of_ability_date: '2029-10-01',
  time_launch_note: 'FI activity over the last 3 years.',
  refresher_note: 'No note.',
  activity_report_url: '/api/instructor/club-instructors/42/flight-activity.pdf',
  data_status: 'stale',
  data_status_message: 'Logbook cache was last verified over 48 hours ago.',
  cache_verified_at: '2026-09-22T10:00:00Z',
  cache_updated_at: '2026-09-22T10:00:00Z',
}

describe('ClubInstructorsTable', () => {
  it('renders report values and emits the selected instructor', async () => {
    const wrapper = mount(ClubInstructorsTable, {
      props: { instructors: [instructor], downloadingProfileId: null },
    })

    expect(wrapper.text()).toContain('Rick Wiles')
    expect(wrapper.text()).toContain('154:31')
    expect(wrapper.text()).toContain('1 Feb 2028')
    expect(wrapper.text()).toContain('stale')

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('download')).toEqual([[instructor]])
  })

  it('disables report download when the backend did not provide it', () => {
    const wrapper = mount(ClubInstructorsTable, {
      props: {
        instructors: [{ ...instructor, activity_report_url: null }],
        downloadingProfileId: null,
      },
    })

    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })
})
