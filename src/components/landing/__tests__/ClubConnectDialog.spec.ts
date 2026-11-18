import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ClubConnectDialog from '@/components/landing/ClubConnectDialog.vue'
import { ApiError } from '@/api/errors'

const api = vi.hoisted(() => ({ sendClubInquiry: vi.fn() }))
vi.mock('@/api/clubInquiries', () => api)

async function mountOpen() {
  const wrapper = mount(ClubConnectDialog, { props: { open: false } })
  await wrapper.setProps({ open: true })
  await flushPromises()
  return wrapper
}

describe('ClubConnectDialog', () => {
  beforeEach(() => {
    api.sendClubInquiry.mockReset()
  })

  it('shows that it is free and prefills the message', async () => {
    const wrapper = await mountOpen()
    expect(wrapper.text()).toContain('Free for clubs')
    const message = wrapper.find<HTMLTextAreaElement>('#club-connect-message').element.value
    expect(message).toContain('connect to Glider Pilot Logbook club automation')
  })

  it('asks for an email or a phone before sending', async () => {
    const wrapper = await mountOpen()
    await wrapper.find('#club-connect-club').setValue('Oxford GC')
    await wrapper.find('#club-connect-name').setValue('Jane')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(api.sendClubInquiry).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Please give an email address or a phone number.')
  })

  it('sends the request and thanks the user', async () => {
    api.sendClubInquiry.mockResolvedValue({ status: 'received' })
    const wrapper = await mountOpen()
    await wrapper.find('#club-connect-club').setValue(' Oxford GC ')
    await wrapper.find('#club-connect-name').setValue('Jane')
    await wrapper.find('#club-connect-phone').setValue('+44 7700 900123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.sendClubInquiry).toHaveBeenCalledWith(
      expect.objectContaining({
        club_name: 'Oxford GC',
        contact_name: 'Jane',
        email: '',
        phone: '+44 7700 900123',
        website: '',
        turnstile_token: '',
      }),
    )
    expect(wrapper.find('[data-testid="club-connect-thanks"]').text()).toContain(
      'We will get in touch with you shortly.',
    )
  })

  it('shows server field errors', async () => {
    api.sendClubInquiry.mockRejectedValue(
      new ApiError(400, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid',
        details: { email: ['Enter a valid email address.'] },
      }),
    )
    const wrapper = await mountOpen()
    await wrapper.find('#club-connect-club').setValue('Oxford GC')
    await wrapper.find('#club-connect-name').setValue('Jane')
    await wrapper.find('#club-connect-email').setValue('bad')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Enter a valid email address.')
  })
})
