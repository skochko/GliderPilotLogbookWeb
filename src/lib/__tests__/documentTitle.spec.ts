import { describe, expect, it } from 'vitest'
import {
  APP_ROUTE_TITLES,
  PUBLIC_PAGE_DESCRIPTIONS,
  PUBLIC_PAGE_TITLES,
  getDocumentTitle,
  getPublicPageDescription,
} from '@/lib/documentTitle'

describe('documentTitle', () => {
  it('defines unique public page titles', () => {
    const titles = Object.values(PUBLIC_PAGE_TITLES)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('defines unique public meta descriptions within snippet length', () => {
    const descriptions = Object.values(PUBLIC_PAGE_DESCRIPTIONS)
    expect(new Set(descriptions).size).toBe(descriptions.length)
    for (const description of descriptions) {
      expect(description.length).toBeGreaterThan(80)
      expect(description.length).toBeLessThanOrEqual(165)
    }
  })

  it('uses marketing titles for club pages', () => {
    expect(PUBLIC_PAGE_TITLES['/club/synchronisation']).toBe(
      'For Clubs: Automated Synchronisation – Glider Pilot Logbook',
    )
    expect(PUBLIC_PAGE_TITLES['/privacy']).toBe('Privacy Policy – Glider Pilot Logbook')
    expect(PUBLIC_PAGE_TITLES['/']).toBe(
      'Glider Pilot Logbook – Digital Flight Logbook for Glider Pilots',
    )
  })

  it('resolves titles and descriptions by route', () => {
    expect(getDocumentTitle({ path: '/faq', name: 'page-faq' })).toBe(
      'FAQ – Glider Pilot Logbook Questions & Answers',
    )
    expect(getPublicPageDescription('/faq')).toMatch(/Google Sheets logbooks/)
    expect(getDocumentTitle({ path: '/dashboard', name: 'dashboard' })).toBe(
      APP_ROUTE_TITLES.dashboard,
    )
  })
})
