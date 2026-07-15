import { apiJson } from './client'

export interface LookupOption {
  code: string
  name: string
}

export async function fetchLicenseTypes(): Promise<LookupOption[]> {
  return apiJson<LookupOption[]>('/license-types')
}

export async function fetchLicenseAuthorities(): Promise<LookupOption[]> {
  return apiJson<LookupOption[]>('/license-authorities')
}
