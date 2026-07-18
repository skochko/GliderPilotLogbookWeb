import { SITE_PAGE_ROUTES, type RoutablePageType } from './sitePages'
import {
  PAGE_TYPE_DESCRIPTIONS,
  PAGE_TYPE_TITLES,
  PUBLIC_PAGE_DESCRIPTIONS,
  PUBLIC_PAGE_TITLES,
} from './documentTitle'

export { SITE_NAME } from './documentTitle'

export const SITE_ORIGIN = 'https://gliderpilotlogbook.co.uk'
export const OG_IMAGE_PATH = '/og-image.png'
export const OG_IMAGE_URL = `${SITE_ORIGIN}${OG_IMAGE_PATH}`
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export type SharePageMeta = {
  path: string
  title: string
  description: string
}

export function getSharePages(): SharePageMeta[] {
  return [
    {
      path: '/',
      title: PUBLIC_PAGE_TITLES['/']!,
      description: PUBLIC_PAGE_DESCRIPTIONS['/']!,
    },
    ...SITE_PAGE_ROUTES.map((page) => ({
      path: page.path,
      title: PAGE_TYPE_TITLES[page.type],
      description: PAGE_TYPE_DESCRIPTIONS[page.type],
    })),
    {
      path: '/login',
      title: PUBLIC_PAGE_TITLES['/login']!,
      description: PUBLIC_PAGE_DESCRIPTIONS['/login']!,
    },
    {
      path: '/unsubscribe',
      title: PUBLIC_PAGE_TITLES['/unsubscribe']!,
      description: PUBLIC_PAGE_DESCRIPTIONS['/unsubscribe']!,
    },
  ]
}

export function canonicalUrl(path: string): string {
  if (path === '/') {
    return `${SITE_ORIGIN}/`
  }
  return `${SITE_ORIGIN}${path}`
}

// Re-export for tests that import description by page type.
export type { RoutablePageType }
