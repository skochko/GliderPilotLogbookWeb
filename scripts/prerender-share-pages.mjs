import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')
const indexPath = join(distDir, 'index.html')

const jiti = createJiti(import.meta.url)
const {
  OG_IMAGE_URL,
  SITE_NAME,
  canonicalUrl,
  getSharePages,
} = jiti('../src/lib/shareMeta.ts')

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function injectShareMeta(html, page) {
  const title = escapeHtml(page.title)
  const description = escapeHtml(page.description)
  const url = escapeHtml(canonicalUrl(page.path))

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${description}" />`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${title}" />`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${description}" />`,
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:url" content="${url}" />`,
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
      `<meta name="twitter:title" content="${title}" />`,
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="twitter:description" content="${description}" />`,
    )
    .replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:image" content="${OG_IMAGE_URL}" />`,
    )
    .replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/,
      `<meta name="twitter:image" content="${OG_IMAGE_URL}" />`,
    )
    .replace(
      /<meta\s+property="og:site_name"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:site_name" content="${SITE_NAME}" />`,
    )
}

function writeShareHtml(page, html) {
  const rendered = injectShareMeta(html, page)

  if (page.path === '/') {
    writeFileSync(indexPath, rendered)
    return
  }

  const targetDir = join(distDir, page.path.slice(1))
  mkdirSync(targetDir, { recursive: true })
  writeFileSync(join(targetDir, 'index.html'), rendered)
}

const baseHtml = readFileSync(indexPath, 'utf8')
for (const page of getSharePages()) {
  writeShareHtml(page, baseHtml)
  console.log(`share meta: ${page.path} → ${page.title}`)
}
