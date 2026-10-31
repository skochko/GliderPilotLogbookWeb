import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DashboardLegalityGroups from '@/components/DashboardLegalityGroups.vue'
import type { DashboardLegalityGroup } from '@/types'

const groups: DashboardLegalityGroup[] = [
  {
    id: 'pilot_privileges',
    title: 'Pilot privileges',
    chip_section_title: '',
    chips: [],
    rows: [
      {
        id: 'flight_currency',
        label: 'Flight currency',
        status: 'current',
        status_text: 'Current',
        obtained: '',
        required: '',
        requirements: [
          {
            id: 'pic_p2_time',
            title: 'PIC and P2 time',
            label: 'Flight time',
            status: 'current',
            obtained: '6:00',
            required: '5:00',
            regulation_url: 'https://regulator.example/rules/pic-time',
          },
        ],
      },
    ],
  },
]

describe('DashboardLegalityGroups', () => {
  it('shows the official regulation link with the expanded requirement', async () => {
    const wrapper = mount(DashboardLegalityGroups, { props: { groups } })

    expect(wrapper.find('a').exists()).toBe(false)
    await wrapper.get('button').trigger('click')

    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('https://regulator.example/rules/pic-time')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(link.attributes('aria-label')).toContain('Flight time')
  })
})
