import {
  getDocumentTitle,
  getPublicPageDescription,
  PUBLIC_PAGE_DESCRIPTIONS,
  SITE_NAME,
  SITE_TAGLINE,
} from '@/lib/documentTitle'

function setMetaContent(selector: string, attribute: string, value: string): void {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${selector}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, selector)
    document.head.appendChild(element)
  }
  element.content = value
}

export function applyRouteSeo(route: {
  path: string
  name?: string | symbol | null
}): void {
  document.title = getDocumentTitle(route)

  const description =
    getPublicPageDescription(route.path) ??
    PUBLIC_PAGE_DESCRIPTIONS['/'] ??
    `${SITE_NAME} – ${SITE_TAGLINE}`
  setMetaContent('description', 'name', description)
  setMetaContent('og:description', 'property', description)
  setMetaContent('twitter:description', 'name', description)
}
