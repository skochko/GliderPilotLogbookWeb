import { afterEach, describe, expect, it } from 'vitest'
import {
  ESSENTIAL_COOKIES_NOTICE_KEY,
  hasSeenEssentialCookiesNotice,
  markEssentialCookiesNoticeSeen,
} from '../cookieNotice'

afterEach(() => {
  window.localStorage.removeItem(ESSENTIAL_COOKIES_NOTICE_KEY)
})

describe('cookieNotice', () => {
  it('starts unseen and persists dismissal', () => {
    expect(hasSeenEssentialCookiesNotice()).toBe(false)

    markEssentialCookiesNoticeSeen()

    expect(hasSeenEssentialCookiesNotice()).toBe(true)
    expect(window.localStorage.getItem(ESSENTIAL_COOKIES_NOTICE_KEY)).toBe('1')
  })
})
