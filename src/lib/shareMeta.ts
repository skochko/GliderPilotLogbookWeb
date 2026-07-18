import { SITE_PAGE_ROUTES, type RoutablePageType } from './sitePages'

export const SITE_ORIGIN = 'https://gliderpilotlogbook.co.uk'
export const SITE_NAME = 'Glider Pilot Logbook'
export const OG_IMAGE_PATH = '/og-image.png'
export const OG_IMAGE_URL = `${SITE_ORIGIN}${OG_IMAGE_PATH}`
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export type SharePageMeta = {
  path: string
  title: string
  description: string
}

const DEFAULT_DESCRIPTION =
  'Web application for glider pilots. Your Google Spreadsheet remains your flight logbook; Glider Pilot Logbook connects to it after you sign in with Google.'

const PAGE_DESCRIPTIONS: Record<RoutablePageType, string> = {
  about:
    'Learn what Glider Pilot Logbook is, how it works with Google Sheets, and how clubs can automate flight imports.',
  contact: 'Contact Glider Pilot Logbook support and privacy teams.',
  faq: 'Frequently asked questions about Google Sheets logbooks, club sync, Google Drive permissions, and account security.',
  privacy: 'Privacy Policy — how Glider Pilot Logbook collects, uses, and protects your personal data (UK GDPR).',
  terms: 'Terms of Service for using Glider Pilot Logbook.co.uk.',
  cookies: 'Cookie Policy — how Glider Pilot Logbook uses strictly necessary session and security cookies.',
  disclaimer: 'Disclaimer — Glider Pilot Logbook is a spreadsheet tool, not official aviation advice or an authority logbook.',
  google_drive_access:
    'Which Google Drive permissions the app uses, when full Drive access applies, and how to remove it from your Google Account.',
  club_automation_download:
    'Downloads for gliding clubs — Glider Pilot Logbook Automation (Windows), publisher certificate, and release package.',
  club_automation:
    'Club automation — how gliding clubs import flights into pilots’ Google Sheets logbooks with consent.',
}

export function pageTitle(label: string): string {
  return label === SITE_NAME ? SITE_NAME : `${label} — ${SITE_NAME}`
}

export function getSharePages(): SharePageMeta[] {
  const staticPages: SharePageMeta[] = [
    {
      path: '/',
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
    },
    ...SITE_PAGE_ROUTES.map((page) => ({
      path: page.path,
      title: pageTitle(page.label),
      description: PAGE_DESCRIPTIONS[page.type],
    })),
    {
      path: '/login',
      title: pageTitle('Sign in'),
      description: 'Sign in to Glider Pilot Logbook with your Google account to connect your spreadsheet logbook.',
    },
  ]

  return staticPages
}

export function canonicalUrl(path: string): string {
  if (path === '/') {
    return `${SITE_ORIGIN}/`
  }
  return `${SITE_ORIGIN}${path}`
}
