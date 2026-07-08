import { describe, expect, it } from 'vitest'
import { SITE_PAGES, getSitePageByPath, getSitePageLabel, isSitePageType } from '@/lib/sitePages'

describe('sitePages', () => {
  it('maps known paths to page types', () => {
    expect(getSitePageByPath('/privacy')?.type).toBe('privacy')
    expect(getSitePageByPath('/unknown')).toBeUndefined()
  })

  it('validates page types', () => {
    expect(isSitePageType('faq')).toBe(true)
    expect(isSitePageType('blog')).toBe(false)
  })

  it('provides labels for all configured pages', () => {
    for (const page of SITE_PAGES) {
      expect(getSitePageLabel(page.type)).toBe(page.label)
    }
  })
})
