import { apiJson } from './client'
import type { Page, SitePageType } from '@/types'
import type { HelpPageType } from '@/lib/sitePages'

export type LogbookManualPageType = 'logbook_create_manual_short' | 'logbook_create_manual_detail'

export function getPage(pageType: SitePageType | HelpPageType | LogbookManualPageType): Promise<Page> {
  return apiJson<Page>(`/pages/${pageType}`)
}
