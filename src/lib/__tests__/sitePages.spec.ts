import { describe, expect, it } from 'vitest'
import {
  CLUB_PAGES,
  SITE_PAGES,
  getSitePageByPath,
  getSitePageLabel,
  isSitePageType,
} from '@/lib/sitePages'

describe('sitePages', () => {
  it('maps known paths to page types', () => {
    expect(getSitePageByPath('/privacy')?.type).toBe('privacy')
    expect(getSitePageByPath('/club/downloads')?.type).toBe('club_automation_download')
    expect(getSitePageByPath('/club/automation')?.type).toBe('club_automation')
    expect(getSitePageByPath('/unknown')).toBeUndefined()
  })

  it('validates page types', () => {
    expect(isSitePageType('faq')).toBe(true)
    expect(isSitePageType('club_automation')).toBe(false)
  })

  it('provides labels for all configured pages', () => {
    for (const page of SITE_PAGES) {
      expect(getSitePageLabel(page.type)).toBe(page.label)
    }
    for (const page of CLUB_PAGES) {
      expect(getSitePageLabel(page.type)).toBe(page.label)
    }
  })
})
