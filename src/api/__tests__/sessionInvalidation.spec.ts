import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, parseApiError } from '../errors'
import {
  notifyAccountIncomplete,
  registerAccountIncompleteHandler,
  resetAccountIncompleteHandler,
} from '../sessionInvalidation'

describe('notifyAccountIncomplete', () => {
  beforeEach(() => {
    resetAccountIncompleteHandler()
  })

  it('invokes registered handler once', async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    registerAccountIncompleteHandler(handler)

    await notifyAccountIncomplete('Please sign in again with Google.')
    await notifyAccountIncomplete('ignored duplicate')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('Please sign in again with Google.')
  })
})

describe('ACCOUNT_INCOMPLETE API error', () => {
  it('parses structured body', async () => {
    const res = new Response(
      JSON.stringify({
        error: {
          code: 'ACCOUNT_INCOMPLETE',
          message: 'Your account is incomplete. Please sign out and sign in again with Google.',
          details: {},
        },
      }),
      { status: 401, statusText: 'Unauthorized' },
    )

    const err = await parseApiError(res)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.code).toBe('ACCOUNT_INCOMPLETE')
    expect(err.status).toBe(401)
  })
})
