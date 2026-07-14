export const ESSENTIAL_COOKIES_NOTICE_KEY = 'gpl-essential-cookies-notice-seen'

export function hasSeenEssentialCookiesNotice(): boolean {
  if (typeof window === 'undefined') {
    return true
  }
  return window.localStorage.getItem(ESSENTIAL_COOKIES_NOTICE_KEY) === '1'
}

export function markEssentialCookiesNoticeSeen(): void {
  window.localStorage.setItem(ESSENTIAL_COOKIES_NOTICE_KEY, '1')
}
