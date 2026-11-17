import { describe, expect, it, vi } from 'vitest'
import { demoLinkRedirect } from '@/lib/routeAccess'
import type { UserMe } from '@/types'

const pilot = (hasLogbook: boolean, isDemo = false) =>
  ({ has_logbook: hasLogbook, is_demo: isDemo }) as UserMe

describe('demoLinkRedirect', () => {
  it('starts the demo for guests and opens the dashboard', async () => {
    const startDemo = vi.fn().mockResolvedValue(pilot(true))
    const onUnavailable = vi.fn()
    await expect(demoLinkRedirect(null, startDemo, onUnavailable)).resolves.toEqual({
      name: 'dashboard',
    })
    expect(startDemo).toHaveBeenCalledOnce()
    expect(onUnavailable).not.toHaveBeenCalled()
  })

  it('sends guests to the landing page when the demo is unavailable', async () => {
    const onUnavailable = vi.fn()
    await expect(
      demoLinkRedirect(null, vi.fn().mockResolvedValue(null), onUnavailable),
    ).resolves.toEqual({ name: 'landing' })
    expect(onUnavailable).toHaveBeenCalledOnce()
  })

  it('keeps signed-in pilots in their own logbook', async () => {
    const startDemo = vi.fn()
    await expect(demoLinkRedirect(pilot(true), startDemo, vi.fn())).resolves.toEqual({
      name: 'dashboard',
    })
    await expect(demoLinkRedirect(pilot(false), startDemo, vi.fn())).resolves.toEqual({
      name: 'connect',
    })
    expect(startDemo).not.toHaveBeenCalled()
  })

  it('signs a pilot out and opens the demo when the link asks to switch', async () => {
    const calls: string[] = []
    const signOut = vi.fn(async () => {
      calls.push('signOut')
      return true
    })
    const startDemo = vi.fn(async () => {
      calls.push('startDemo')
      return pilot(true, true)
    })
    await expect(demoLinkRedirect(pilot(false), startDemo, vi.fn(), signOut)).resolves.toEqual({
      name: 'dashboard',
    })
    expect(calls).toEqual(['signOut', 'startDemo'])
  })

  it('keeps the pilot in their account if sign-out fails', async () => {
    const startDemo = vi.fn()
    await expect(
      demoLinkRedirect(pilot(true), startDemo, vi.fn(), vi.fn().mockResolvedValue(false)),
    ).resolves.toEqual({ name: 'dashboard' })
    expect(startDemo).not.toHaveBeenCalled()
  })

  it('does not restart the demo for someone already in it', async () => {
    const signOut = vi.fn()
    const startDemo = vi.fn()
    await expect(demoLinkRedirect(pilot(true, true), startDemo, vi.fn(), signOut)).resolves.toEqual(
      { name: 'dashboard' },
    )
    expect(signOut).not.toHaveBeenCalled()
    expect(startDemo).not.toHaveBeenCalled()
  })
})
