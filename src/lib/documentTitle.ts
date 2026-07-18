import type { RoutablePageType } from './sitePages'

export const SITE_NAME = 'Glider Pilot Logbook'
export const SITE_TAGLINE = 'Digital Flight Logbook for Glider Pilots'

/** Browser tab & Open Graph titles for public routes (path → title). */
export const PUBLIC_PAGE_TITLES: Record<string, string> = {
  '/': `${SITE_NAME} – ${SITE_TAGLINE}`,
  '/about': `About – ${SITE_NAME}`,
  '/contact': `Contact – ${SITE_NAME}`,
  '/faq': 'FAQ – Glider Pilot Logbook Questions & Answers',
  '/privacy': `Privacy Policy – ${SITE_NAME}`,
  '/terms': `Terms of Service – ${SITE_NAME}`,
  '/cookies': `Cookie Policy – ${SITE_NAME}`,
  '/disclaimer': `Disclaimer – ${SITE_NAME}`,
  '/help/google-drive-access':
    'Google Drive Access – Why Glider Pilot Logbook Requests These Permissions',
  '/club/automation': 'Club Integration – Automatic Flight Import for Gliding Clubs',
  '/club/downloads': 'Club Downloads – Windows Software for Gliding Clubs',
  '/login': `Get Started – ${SITE_NAME}`,
  '/unsubscribe': `Email Unsubscribe – ${SITE_NAME}`,
}

/**
 * Meta descriptions for public pages (aim ~150–160 characters for search snippets).
 * Also used for og:description on prerendered routes.
 */
export const PUBLIC_PAGE_DESCRIPTIONS: Record<string, string> = {
  '/':
    'Manage your gliding logbook in Google Sheets. Log flights, track currency and medical dates, and view statistics — your spreadsheet stays the official record.',
  '/about':
    'Learn how Glider Pilot Logbook works with Google Sheets — flight logging, dashboards, and optional automatic club flight import for pilots and gliding clubs.',
  '/contact':
    'Contact Glider Pilot Logbook support and privacy teams. Get help with your logbook, Google sign-in, club automation, or data protection questions.',
  '/faq':
    'FAQ for glider pilots: Google Sheets logbooks, Google Drive permissions, club flight import, medical dates, disconnecting your account, and data privacy.',
  '/privacy':
    'How Glider Pilot Logbook collects, uses, stores, and protects your personal data. UK GDPR Privacy Policy for pilots using our Google Sheets logbook web app.',
  '/terms':
    'Terms of Service for Glider Pilot Logbook.co.uk — using the web app, your Google Spreadsheet logbook, backups, Google access, and optional club synchronization.',
  '/cookies':
    'Cookie Policy for Glider Pilot Logbook. We use strictly necessary session and security cookies only — no advertising or analytics cookies on the main application.',
  '/disclaimer':
    'Glider Pilot Logbook is a Google Sheets tool, not an official CAA logbook or aviation advice. Review entries before relying on them for licensing or insurance.',
  '/help/google-drive-access':
    'Why Glider Pilot Logbook requests Google Drive access: per-file logbook use day to day, full Drive only for automatic setup, and how to revoke permissions.',
  '/club/automation':
    'How gliding clubs import flights into pilots’ Google Sheets logbooks with consent. Guide to club integration and automatic flight log import.',
  '/club/downloads':
    'Download Glider Pilot Logbook Automation for Windows gliding clubs — publisher certificate, release package, and setup guidance for club IT teams.',
  '/login':
    'Get started with Glider Pilot Logbook using your Google account. Create or connect your gliding flight logbook spreadsheet — no separate password.',
  '/unsubscribe':
    'Unsubscribe from Glider Pilot Logbook reminder emails. Your flight logbook in Google Sheets and Google account access are not affected.',
}

export const PAGE_TYPE_DESCRIPTIONS: Record<RoutablePageType, string> = {
  about: PUBLIC_PAGE_DESCRIPTIONS['/about']!,
  contact: PUBLIC_PAGE_DESCRIPTIONS['/contact']!,
  faq: PUBLIC_PAGE_DESCRIPTIONS['/faq']!,
  privacy: PUBLIC_PAGE_DESCRIPTIONS['/privacy']!,
  terms: PUBLIC_PAGE_DESCRIPTIONS['/terms']!,
  cookies: PUBLIC_PAGE_DESCRIPTIONS['/cookies']!,
  disclaimer: PUBLIC_PAGE_DESCRIPTIONS['/disclaimer']!,
  google_drive_access: PUBLIC_PAGE_DESCRIPTIONS['/help/google-drive-access']!,
  club_automation: PUBLIC_PAGE_DESCRIPTIONS['/club/automation']!,
  club_automation_download: PUBLIC_PAGE_DESCRIPTIONS['/club/downloads']!,
}

export function getPublicPageDescription(path: string): string | undefined {
  return PUBLIC_PAGE_DESCRIPTIONS[path]
}

/** Authenticated app routes (route name → title). */
export const APP_ROUTE_TITLES: Record<string, string> = {
  connect: `Connect Logbook – ${SITE_NAME}`,
  'logbook-create': `Create Logbook – ${SITE_NAME}`,
  'logbook-create-manual-guide': `Create Logbook Manually – ${SITE_NAME}`,
  dashboard: `Dashboard – ${SITE_NAME}`,
  flights: `Flights – ${SITE_NAME}`,
  'flight-create': `Add Flight – ${SITE_NAME}`,
  'flight-edit': `Edit Flight – ${SITE_NAME}`,
  statistics: `Statistics – ${SITE_NAME}`,
  settings: `Settings – ${SITE_NAME}`,
  automation: `Club Automation Request – ${SITE_NAME}`,
  profile: `Profile – ${SITE_NAME}`,
}

export function getPublicPageTitle(path: string): string | undefined {
  return PUBLIC_PAGE_TITLES[path]
}

export function getDocumentTitle(route: {
  path: string
  name?: string | symbol | null
}): string {
  const byPath = PUBLIC_PAGE_TITLES[route.path]
  if (byPath) {
    return byPath
  }

  if (route.name) {
    const byName = APP_ROUTE_TITLES[String(route.name)]
    if (byName) {
      return byName
    }
  }

  return PUBLIC_PAGE_TITLES['/'] ?? SITE_NAME
}

/** @deprecated Use getPublicPageTitle or PUBLIC_PAGE_TITLES — kept for share meta by page type. */
export const PAGE_TYPE_TITLES: Record<RoutablePageType, string> = {
  about: PUBLIC_PAGE_TITLES['/about']!,
  contact: PUBLIC_PAGE_TITLES['/contact']!,
  faq: PUBLIC_PAGE_TITLES['/faq']!,
  privacy: PUBLIC_PAGE_TITLES['/privacy']!,
  terms: PUBLIC_PAGE_TITLES['/terms']!,
  cookies: PUBLIC_PAGE_TITLES['/cookies']!,
  disclaimer: PUBLIC_PAGE_TITLES['/disclaimer']!,
  google_drive_access: PUBLIC_PAGE_TITLES['/help/google-drive-access']!,
  club_automation: PUBLIC_PAGE_TITLES['/club/automation']!,
  club_automation_download: PUBLIC_PAGE_TITLES['/club/downloads']!,
}
