import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchGoogleScopes = vi.fn()
vi.mock('@/api/auth', () => ({ fetchGoogleScopes: () => fetchGoogleScopes() }))

import { resetGoogleAccessState, useGoogleAccess } from '@/composables/useGoogleAccess'

const ok = { available: true, scopes: [], sign_in: true, drive_file: true }

describe('useGoogleAccess', () => {
  beforeEach(() => {
    resetGoogleAccessState()
    fetchGoogleScopes.mockReset()
  })

  it('asks to reconnect when Google refused to renew access', async () => {
    fetchGoogleScopes.mockResolvedValue({
      ...ok,
      available: false,
      sign_in: false,
      drive_file: false,
    })
    const { needsReconnect, check } = useGoogleAccess()
    await check()
    expect(needsReconnect.value).toBe(true)
  })

  it('asks to reconnect when Drive access is missing', async () => {
    fetchGoogleScopes.mockResolvedValue({ ...ok, drive_file: false })
    const { needsReconnect, check } = useGoogleAccess()
    await check()
    expect(needsReconnect.value).toBe(true)
  })

  it('stays quiet when access works or the check fails', async () => {
    const { needsReconnect, check } = useGoogleAccess()
    fetchGoogleScopes.mockRejectedValueOnce(new Error('network'))
    await check()
    expect(needsReconnect.value).toBe(false)

    fetchGoogleScopes.mockResolvedValue(ok)
    await check()
    expect(needsReconnect.value).toBe(false)
  })

  it('checks once unless forced', async () => {
    fetchGoogleScopes.mockResolvedValue(ok)
    const { check } = useGoogleAccess()
    await check()
    await check()
    expect(fetchGoogleScopes).toHaveBeenCalledTimes(1)
    await check(true)
    expect(fetchGoogleScopes).toHaveBeenCalledTimes(2)
  })
})
