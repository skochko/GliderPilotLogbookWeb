import { apiJson } from './client'
import type { Page, SitePageType } from '@/types'

export type LogbookManualPageType = 'logbook_create_manual_short' | 'logbook_create_manual_detail'

export function getPage(pageType: SitePageType | LogbookManualPageType): Promise<Page> {
  return apiJson<Page>(`/pages/${pageType}`)
}
