import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const outputPath = join(publicDir, 'sitemap.xml')
const siteOrigin = 'https://gliderpilotlogbook.co.uk'

const jiti = createJiti(import.meta.url)
const { getSitemapEntries } = jiti('../src/lib/sitemap.ts')
const entries = getSitemapEntries()

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
