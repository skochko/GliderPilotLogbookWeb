import { apiJson } from './client'
import type { Page, SitePageType } from '@/types'

export function getPage(pageType: SitePageType): Promise<Page> {
  return apiJson<Page>(`/pages/${pageType}`)
}
