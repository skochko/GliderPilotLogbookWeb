import { describe, expect, it } from 'vitest'
import { SITE_PAGE_ROUTES } from '@/lib/sitePages'
import { canonicalUrl, getSharePages, pageTitle } from '@/lib/shareMeta'

describe('shareMeta', () => {
  it('provides unique titles and descriptions for public pages', () => {
    const pages = getSharePages()
    const titles = new Set(pages.map((page) => page.title))
    const descriptions = new Set(pages.map((page) => page.description))

    expect(pages.length).toBeGreaterThan(SITE_PAGE_ROUTES.length)
    expect(titles.size).toBe(pages.length)
    expect(descriptions.size).toBe(pages.length)
  })

  it('builds canonical URLs', () => {
    expect(canonicalUrl('/')).toBe('https://gliderpilotlogbook.co.uk/')
    expect(canonicalUrl('/club/automation')).toBe('https://gliderpilotlogbook.co.uk/club/automation')
  })

  it('formats page titles', () => {
    expect(pageTitle('Club automation')).toBe('Club automation — Glider Pilot Logbook')
    expect(pageTitle('Glider Pilot Logbook')).toBe('Glider Pilot Logbook')
  })

  it('includes club pages with section-specific copy', () => {
    const clubAutomation = getSharePages().find((page) => page.path === '/club/automation')
    expect(clubAutomation?.title).toContain('Automation')
    expect(clubAutomation?.description.toLowerCase()).toContain('club')
  })
})
