import { apiJson } from './client'
import type { Page } from '@/types'
import type { RoutablePageType } from '@/lib/sitePages'

export type LogbookManualPageType = 'logbook_create_manual_short' | 'logbook_create_manual_detail'

export function getPage(pageType: RoutablePageType | LogbookManualPageType): Promise<Page> {
  return apiJson<Page>(`/pages/${pageType}`)
}
