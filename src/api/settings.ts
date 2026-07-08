import { apiJson } from './client'
import type { SheetSettings, SheetSettingsPatch } from '@/types'

export function getSettings(): Promise<SheetSettings> {
  return apiJson<SheetSettings>('/settings')
}

export function updateSettings(payload: SheetSettingsPatch): Promise<SheetSettings> {
  return apiJson<SheetSettings>('/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
