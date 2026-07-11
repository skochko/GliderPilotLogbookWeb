import { apiJson } from './client'

export interface OrganizationListItem {
  id: number
  name: string
  slug: string
  organization_type: string
  website_url: string
  logo_url: string
}

export function listOrganizations(): Promise<OrganizationListItem[]> {
  return apiJson<OrganizationListItem[]>('/organizations')
}
