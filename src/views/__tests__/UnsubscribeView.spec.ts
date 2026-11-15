import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UnsubscribeView from '@/views/UnsubscribeView.vue'

const api = vi.hoisted(() => ({ unsubscribe: vi.fn() }))
vi.mock('@/api/notifications', () => api)

const route = vi.hoisted(() => ({ query: {} as Record<string, unknown> }))
vi.mock('vue-router', () => ({ useRoute: () => route }))

function mountView() {
  return mount(UnsubscribeView, {
    global: { stubs: { PublicPageShell: { template: '<div><slot /></div>' }, RouterLink: true } },
  })
}

describe('UnsubscribeView', () => {
  beforeEach(() => {
    api.unsubscribe.mockReset()
    route.query = { token: 'abc' }
  })

  it('does not unsubscribe just by opening the page', async () => {
    const wrapper = mountView()
    await flushPromises()
    expect(api.unsubscribe).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="unsubscribe-confirm"]').exists()).toBe(true)
  })

  it('unsubscribes after the button is clicked', async () => {
    api.unsubscribe.mockResolvedValue({ status: 'unsubscribed' })
    const wrapper = mountView()
    await wrapper.find('[data-action="confirm-unsubscribe"]').trigger('click')
    await flushPromises()
    expect(api.unsubscribe).toHaveBeenCalledWith('abc')
    expect(wrapper.find('[data-testid="unsubscribe-success"]').exists()).toBe(true)
  })

  it('keeps the button available when unsubscribing fails', async () => {
    api.unsubscribe.mockRejectedValue(new Error('boom'))
    const wrapper = mountView()
    await wrapper.find('[data-action="confirm-unsubscribe"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Could not unsubscribe')
    expect(wrapper.find('[data-action="confirm-unsubscribe"]').exists()).toBe(true)
  })

  it('shows an error without a token', () => {
    route.query = {}
    const wrapper = mountView()
    expect(wrapper.text()).toContain('invalid or incomplete')
    expect(wrapper.find('[data-action="confirm-unsubscribe"]').exists()).toBe(false)
  })
})
