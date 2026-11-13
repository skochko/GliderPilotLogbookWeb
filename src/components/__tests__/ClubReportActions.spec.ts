import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ClubReportActions from '@/components/ClubReportActions.vue'
import { resetProfileState, useProfile } from '@/composables/useProfile'
import { resetToastState, useToast } from '@/composables/useToast'
import type { Profile } from '@/types'

const profileApi = vi.hoisted(() => ({ getProfile: vi.fn(), updateProfile: vi.fn() }))
const oversightApi = vi.hoisted(() => ({
  downloadClubReport: vi.fn(),
  emailClubReport: vi.fn(),
}))
vi.mock('@/api/profile', () => profileApi)
vi.mock('@/api/instructorOversight', () => oversightApi)

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    email: 'cfi@example.com',
    report_email: '',
    effective_report_email: 'cfi@example.com',
    capabilities: { can_view_club_instructor_reports: true },
    ...overrides,
  } as Profile
}

async function mountWithProfile(value: Profile) {
  profileApi.getProfile.mockResolvedValue(value)
  await useProfile().fetch()
  return mount(ClubReportActions, {
    props: { organizationName: 'Test Club', asOf: '2026-11-13' },
    attachTo: document.body,
  })
}

describe('ClubReportActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetProfileState()
    resetToastState()
  })

  it('shows the account email as the default recipient', async () => {
    const wrapper = await mountWithProfile(profile())

    expect(wrapper.get('[data-testid="report-recipient"]').text()).toContain(
      'Sends to cfi@example.com (account email)',
    )
    wrapper.unmount()
  })

  it('emails the report and confirms the recipient', async () => {
    oversightApi.emailClubReport.mockResolvedValue({ recipient: 'reports@club.example' })
    const wrapper = await mountWithProfile(
      profile({
        report_email: 'reports@club.example',
        effective_report_email: 'reports@club.example',
      }),
    )

    await wrapper.get('[data-action="email-club-report"]').trigger('click')
    await flushPromises()

    expect(oversightApi.emailClubReport).toHaveBeenCalledOnce()
    expect(useToast().message.value).toBe('Report sent to reports@club.example')
    wrapper.unmount()
  })

  it('changes the recipient inline and saves it to the profile', async () => {
    profileApi.updateProfile.mockResolvedValue(
      profile({
        report_email: 'reports@club.example',
        effective_report_email: 'reports@club.example',
      }),
    )
    const wrapper = await mountWithProfile(profile())

    await wrapper.get('[data-action="change-report-email"]').trigger('click')
    expect(wrapper.get('[data-action="email-club-report"]').attributes('disabled')).toBeDefined()
    await wrapper.get('#report-email').setValue('reports@club.example')
    await wrapper.get('[data-testid="report-email-form"]').trigger('submit')
    await flushPromises()

    expect(profileApi.updateProfile).toHaveBeenCalledWith({ report_email: 'reports@club.example' })
    expect(wrapper.get('[data-testid="report-recipient"]').text()).toContain(
      'Sends to reports@club.example',
    )
    wrapper.unmount()
  })

  it('stores the account email as empty so it keeps following the account', async () => {
    profileApi.updateProfile.mockResolvedValue(profile())
    const wrapper = await mountWithProfile(
      profile({ report_email: 'old@club.example', effective_report_email: 'old@club.example' }),
    )

    await wrapper.get('[data-action="change-report-email"]').trigger('click')
    await wrapper.get('#report-email').setValue('CFI@example.com')
    await wrapper.get('[data-testid="report-email-form"]').trigger('submit')
    await flushPromises()

    expect(profileApi.updateProfile).toHaveBeenCalledWith({ report_email: '' })
    wrapper.unmount()
  })

  it('shows a send error next to the actions', async () => {
    oversightApi.emailClubReport.mockRejectedValue(new Error('network'))
    const wrapper = await mountWithProfile(profile())

    await wrapper.get('[data-action="email-club-report"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Could not send the report.')
    wrapper.unmount()
  })
})
