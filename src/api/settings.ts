import { apiJson } from './client'
import type { SheetDisplaySettings, SheetSettings, SheetSettingsPatch } from '@/types'

export function getDisplaySettings(): Promise<SheetDisplaySettings> {
  return apiJson<SheetDisplaySettings>('/settings/display')
}

export function getSettings(): Promise<SheetSettings> {
  return apiJson<SheetSettings>('/settings')
}

export function updateSettings(payload: SheetSettingsPatch): Promise<SheetSettings> {
  return apiJson<SheetSettings>('/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
