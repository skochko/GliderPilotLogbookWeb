import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const outputPath = join(publicDir, 'sitemap.xml')
const siteOrigin = 'https://gliderpilotlogbook.co.uk'

const jiti = createJiti(import.meta.url)
const { SITE_PAGE_ROUTES } = jiti('../src/lib/sitePages.ts')

const typeSitemap = {
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

const entries = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  ...SITE_PAGE_ROUTES.map((page) => ({
    path: page.path,
    ...typeSitemap[page.type],
  })),
  { path: '/login', changefreq: 'yearly', priority: 0.6 },
]

function sitemapUrl(path) {
  return path === '/' ? `${siteOrigin}/` : `${siteOrigin}${path}`
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const lastmod = process.argv[2] ?? new Date().toISOString().slice(0, 10)
const urls = entries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(sitemapUrl(entry.path))}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`,
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

writeFileSync(outputPath, xml)
console.log(`wrote ${outputPath} (${entries.length} URLs, lastmod ${lastmod})`)
