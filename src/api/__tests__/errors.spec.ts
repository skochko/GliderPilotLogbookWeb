import { describe, expect, it } from 'vitest'
import { ApiError, isAccountIncompleteError, parseApiError } from '../errors'

describe('parseApiError', () => {
  it('parses structured API error body', async () => {
    const res = new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date',
          details: { date: ['Must be a valid date'] },
        },
      }),
      { status: 400, statusText: 'Bad Request' },
    )

    const err = await parseApiError(res)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.message).toBe('Invalid date')
    expect(err.fieldErrors()).toEqual({ date: ['Must be a valid date'] })
  })

  it('falls back when body is not JSON', async () => {
    const res = new Response('not json', { status: 500, statusText: 'Server Error' })
    const err = await parseApiError(res)
    expect(err.code).toBe('UNKNOWN_ERROR')
    expect(err.message).toBe('Server Error')
  })
})

describe('isAccountIncompleteError', () => {
  it('detects ACCOUNT_INCOMPLETE', () => {
    const err = new ApiError(401, {
      code: 'ACCOUNT_INCOMPLETE',
      message: 'Please sign in again',
      details: {},
    })
    expect(isAccountIncompleteError(err)).toBe(true)
    expect(isAccountIncompleteError(new Error('other'))).toBe(false)
  })
})

describe('ApiError', () => {
  it('maps throttled responses', () => {
    const err = new ApiError(429, {
      code: 'THROTTLED',
      message: 'Rate limit exceeded',
      details: {},
    })
    expect(err.status).toBe(429)
    expect(err.code).toBe('THROTTLED')
  })
})
