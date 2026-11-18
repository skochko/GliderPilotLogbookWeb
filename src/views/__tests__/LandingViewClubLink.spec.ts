import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import LandingView from '@/views/LandingView.vue'

vi.mock('@/api/landing', () => ({
  getLandingContent: vi.fn().mockResolvedValue({ screenshots: [] }),
}))

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: LandingView },
      { path: '/connect-club', name: 'connect-club', component: LandingView },
      { path: '/:any(.*)', component: { template: '<div />' } },
    ],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(LandingView, {
    global: { plugins: [router], stubs: { LandingNav: true, LandingScreenshotFrame: true } },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

describe('LandingView club request link', () => {
  it('opens the club request form on /connect-club', async () => {
    Element.prototype.scrollIntoView = vi.fn()
    const wrapper = await mountAt('/connect-club')
    expect(wrapper.find('#club-connect-title').exists()).toBe(true)
    wrapper.unmount()
  })

  it('keeps the form closed on the home page', async () => {
    const wrapper = await mountAt('/')
    expect(wrapper.find('#club-connect-title').exists()).toBe(false)
    expect(wrapper.find('[data-testid="club-connect-open"]').exists()).toBe(true)
    wrapper.unmount()
  })
})
