import type { TemplateEngineKey } from '@/types'

export type QualificationEventsTemplate = 'legacy' | 'v3'

export function resolveQualificationEventsTemplate(
  engine: TemplateEngineKey | null,
): QualificationEventsTemplate {
  return engine === 'v3' ? 'v3' : 'legacy'
}
