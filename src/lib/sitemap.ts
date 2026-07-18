import { SITE_PAGE_ROUTES } from './sitePages'

type RoutablePageType = (typeof SITE_PAGE_ROUTES)[number]['type']

const SITE_ORIGIN = 'https://gliderpilotlogbook.co.uk'

export type SitemapChangeFreq = 'weekly' | 'monthly' | 'yearly'

export type SitemapEntry = {
  path: string
  changefreq: SitemapChangeFreq
  priority: number
}

const TYPE_SITEMAP: Record<RoutablePageType, Omit<SitemapEntry, 'path'>> = {
  about: { changefreq: 'monthly', priority: 0.8 },
  contact: { changefreq: 'yearly', priority: 0.5 },
  faq: { changefreq: 'monthly', priority: 0.8 },
  privacy: { changefreq: 'yearly', priority: 0.3 },
  terms: { changefreq: 'yearly', priority: 0.3 },
  cookies: { changefreq: 'yearly', priority: 0.3 },
  disclaimer: { changefreq: 'yearly', priority: 0.3 },
  google_drive_access: { changefreq: 'monthly', priority: 0.6 },
  club_automation_download: { changefreq: 'monthly', priority: 0.7 },
  club_automation: { changefreq: 'monthly', priority: 0.7 },
}

export function getSitemapEntries(): SitemapEntry[] {
  return [
    { path: '/', changefreq: 'weekly', priority: 1.0 },
    ...SITE_PAGE_ROUTES.map((page) => ({
      path: page.path,
      ...TYPE_SITEMAP[page.type],
    })),
    { path: '/login', changefreq: 'yearly', priority: 0.6 },
  ]
}

export function sitemapUrl(path: string): string {
  if (path === '/') {
    return `${SITE_ORIGIN}/`
  }
  return `${SITE_ORIGIN}${path}`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function formatSitemapXml(lastmod: string): string {
  const urls = getSitemapEntries()
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(sitemapUrl(entry.path))}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}
