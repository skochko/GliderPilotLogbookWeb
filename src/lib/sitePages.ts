export const SITE_PAGES = [
  { type: 'about', path: '/about', label: 'About' },
  { type: 'contact', path: '/contact', label: 'Contact' },
  { type: 'faq', path: '/faq', label: 'FAQ' },
  { type: 'privacy', path: '/privacy', label: 'Privacy Policy' },
  { type: 'terms', path: '/terms', label: 'Terms of Service' },
  { type: 'cookies', path: '/cookies', label: 'Cookie Policy' },
  { type: 'disclaimer', path: '/disclaimer', label: 'Disclaimer' },
] as const

export type SitePageType = (typeof SITE_PAGES)[number]['type']

const sitePageByType = new Map(SITE_PAGES.map((page) => [page.type, page]))
const sitePageByPath = new Map(SITE_PAGES.map((page) => [page.path, page]))

export function isSitePageType(value: string): value is SitePageType {
  return sitePageByType.has(value as SitePageType)
}

export function getSitePageByPath(path: string) {
  return sitePageByPath.get(path as (typeof SITE_PAGES)[number]['path'])
}

export function getSitePageLabel(type: SitePageType): string {
  return sitePageByType.get(type)?.label ?? type
}
