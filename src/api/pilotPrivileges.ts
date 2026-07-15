import { apiJson } from './client'

export interface PilotPrivilegeOption {
  code: string
  name: string
  is_instructor: boolean
}

export async function fetchPilotPrivileges(): Promise<PilotPrivilegeOption[]> {
  return apiJson<PilotPrivilegeOption[]>('/pilot-privileges')
}
