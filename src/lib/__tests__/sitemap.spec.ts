import { describe, expect, it } from 'vitest'
import { getSitemapEntries, sitemapUrl } from '@/lib/sitemap'

describe('sitemap', () => {
  it('includes club and help pages', () => {
    const paths = getSitemapEntries().map((entry) => entry.path)
    expect(paths).toContain('/club/downloads')
    expect(paths).toContain('/club/automation')
    expect(paths).toContain('/help/google-drive-access')
  })

  it('builds absolute URLs', () => {
    expect(sitemapUrl('/club/automation')).toBe('https://gliderpilotlogbook.co.uk/club/automation')
  })
})
