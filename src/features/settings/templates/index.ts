import type { SheetSettings, TemplateEngineKey } from '@/types'
import { createLegacySettingsAdapter } from './legacy'
import type { SettingsTemplateAdapter } from './types'
import { createV3SettingsAdapter } from './v3'

export type { SettingsSection, SettingsTemplateAdapter } from './types'

export function resolveSettingsTemplate(
  settings: SheetSettings,
  globalEngine?: TemplateEngineKey | null,
): SettingsTemplateAdapter {
  const engine = globalEngine || settings.template_engine
  if (engine === 'v3' || (!engine && settings.template_version?.startsWith('3.'))) {
    return createV3SettingsAdapter(settings)
  }
  return createLegacySettingsAdapter(settings)
}
