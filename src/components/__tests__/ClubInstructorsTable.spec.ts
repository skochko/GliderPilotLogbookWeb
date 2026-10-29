import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
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
  refresher_note: 'No note.',
  training_flights: {
    obtained: 2,
    required: 2,
    valid_until: '2027-09-24',
    remaining_days: 347,
    is_current: true,
    events: [
      {
        date: '2026-09-24',
        event_type: 'Training flight with an FI(s)',
        place: 'Lasham',
        remarks: '',
        valid_until: '2028-09-24',
        remaining_days: 712,
      },
      {
        date: '2025-09-24',
        event_type: 'Training flight with an FI(s)',
        place: '',
        remarks: '',
        valid_until: '2027-09-24',
        remaining_days: 347,
      },
    ],
  },
  activity_report_url: '/api/instructor/club-instructors/42/flight-activity.pdf',
  data_status: 'stale',
  data_status_message: 'Logbook cache was last verified over 48 hours ago.',
  cache_verified_at: '2026-09-22T10:00:00Z',
  cache_updated_at: '2026-09-22T10:00:00Z',
}

describe('ClubInstructorsTable', () => {
  beforeEach(() => window.localStorage.clear())

  it('renders the compact list and retains detail and report actions', async () => {
    const wrapper = mount(ClubInstructorsTable, {
      props: { instructors: [instructor], downloadingProfileId: null },
    })

    expect(wrapper.text()).toContain('Rick Wiles')
    expect(wrapper.text()).toContain('117h 22m')
    expect(wrapper.text()).toContain('1 Feb 2028')
    expect(wrapper.text()).toContain('Stale data')
    expect(wrapper.text()).toContain('347 days left')
    expect(wrapper.get('[data-view="list"]').attributes('aria-pressed')).toBe('true')

    const summary = wrapper.get('#instructor-list article > button')
    expect(summary.attributes('aria-expanded')).toBe('false')
    await summary.trigger('click')
    expect(summary.attributes('aria-expanded')).toBe('true')

    const detailsButton = wrapper
      .findAll('#instructor-list button')
      .find((button) => button.text().includes('View full details'))
    expect(detailsButton).toBeDefined()
    await detailsButton!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([[instructor]])

    await wrapper.get('#instructor-list [data-action="download"]').trigger('click')
    expect(wrapper.emitted('download')).toEqual([[instructor]])
  })

  it('disables report download when the backend did not provide it', () => {
    const wrapper = mount(ClubInstructorsTable, {
      props: {
        instructors: [{ ...instructor, activity_report_url: null }],
        downloadingProfileId: null,
      },
    })

    expect(
      wrapper.get('#instructor-list [data-action="download"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('sorts attention states first and filters by search and status', async () => {
    const wrapper = mount(ClubInstructorsTable, {
      props: {
        instructors: [
          { ...instructor, profile_id: 1, instructor_name: 'Alice', data_status: 'current' },
          { ...instructor, profile_id: 2, instructor_name: 'Steve', data_status: 'incomplete' },
          { ...instructor, profile_id: 3, instructor_name: 'Bob', data_status: 'stale' },
        ],
        downloadingProfileId: null,
      },
    })

    const names = wrapper
      .findAll('#instructor-list article > button > span:first-child > span:first-child')
      .map((cell) => cell.text())
    expect(names).toEqual(['Steve', 'Bob', 'Alice'])

    await wrapper.get('[data-filter="current"]').trigger('click')
    expect(wrapper.findAll('#instructor-list article')).toHaveLength(1)
    expect(wrapper.get('#instructor-list article').text()).toContain('Alice')

    await wrapper.get('[data-filter="all"]').trigger('click')
    await wrapper.get('#instructor-search').setValue('steve')
    expect(wrapper.findAll('#instructor-list article')).toHaveLength(1)
    expect(wrapper.get('#instructor-list article').text()).toContain('Steve')
  })

  it('persists the selected list or table view', async () => {
    const wrapper = mount(ClubInstructorsTable, {
      props: { instructors: [instructor], downloadingProfileId: null },
    })

    await wrapper.get('[data-view="table"]').trigger('click')
    expect(window.localStorage.getItem('club-instructors-view')).toBe('table')
    wrapper.unmount()

    const restored = mount(ClubInstructorsTable, {
      props: { instructors: [instructor], downloadingProfileId: null },
    })
    expect(restored.get('[data-view="table"]').attributes('aria-pressed')).toBe('true')
  })
})
