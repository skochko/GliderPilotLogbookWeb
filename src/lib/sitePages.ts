export const SITE_PAGES = [
  { type: 'about', path: '/about', label: 'About' },
  { type: 'contact', path: '/contact', label: 'Contact' },
  { type: 'faq', path: '/faq', label: 'FAQ' },
  { type: 'privacy', path: '/privacy', label: 'Privacy Policy' },
  { type: 'terms', path: '/terms', label: 'Terms of Service' },
  { type: 'cookies', path: '/cookies', label: 'Cookie Policy' },
  { type: 'disclaimer', path: '/disclaimer', label: 'Disclaimer' },
] as const

/** Help articles — routed like site pages but omitted from the public footer. */
export const HELP_PAGES = [
  { type: 'google_drive_access', path: '/help/google-drive-access', label: 'Google Drive access' },
] as const

/** Club programme — downloads and onboarding for gliding clubs. */
export const CLUB_PAGES = [
  { type: 'club_automation_download', path: '/club/downloads', label: 'Downloads' },
  { type: 'club_automation', path: '/club/synchronisation', label: 'Synchronisation' },
] as const

export const SITE_PAGE_ROUTES = [...SITE_PAGES, ...HELP_PAGES, ...CLUB_PAGES] as const

export type SitePageType = (typeof SITE_PAGES)[number]['type']
export type HelpPageType = (typeof HELP_PAGES)[number]['type']
export type ClubPageType = (typeof CLUB_PAGES)[number]['type']
export type RoutablePageType = SitePageType | HelpPageType | ClubPageType

type RoutablePage = (typeof SITE_PAGE_ROUTES)[number]

const sitePageByType = new Map<string, RoutablePage>(
  SITE_PAGE_ROUTES.map((page) => [page.type, page]),
)
const sitePageByPath = new Map<string, RoutablePage>(
  SITE_PAGE_ROUTES.map((page) => [page.path, page]),
)

export function isSitePageType(value: string): value is SitePageType {
  return sitePageByType.has(value) && SITE_PAGES.some((page) => page.type === value)
}

export function isRoutablePageType(value: string): value is RoutablePageType {
  return sitePageByType.has(value)
}

export function getSitePageByPath(path: string): RoutablePage | undefined {
  return sitePageByPath.get(path)
}

export function getSitePageLabel(type: RoutablePageType): string {
  return sitePageByType.get(type)?.label ?? type
}
