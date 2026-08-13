import type { SheetSettings, SheetSettingsPatch } from '@/types'

export type SettingsSection = 'displayPreferences' | 'medical' | 'summaryDates' | 'clubImport'

export interface SettingsTemplateAdapter {
  key: 'legacy' | 'v3'
  title: string
  description: string
  canEdit(field: keyof SheetSettingsPatch): boolean
  shows(section: SettingsSection): boolean
}

export type SettingsTemplateFactory = (settings: SheetSettings) => SettingsTemplateAdapter

export function editableFields(
  settings: SheetSettings,
  fallback: readonly (keyof SheetSettingsPatch)[],
): ReadonlySet<keyof SheetSettingsPatch> {
  const fields = settings.capabilities?.editable_fields
  return new Set((fields ?? fallback) as (keyof SheetSettingsPatch)[])
}
