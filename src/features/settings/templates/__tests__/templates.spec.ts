import { describe, expect, it } from 'vitest'
import type { SheetSettings } from '@/types'
import { resolveSettingsTemplate } from '..'

function settings(overrides: Partial<SheetSettings> = {}): SheetSettings {
  return {
    date_format: '2026-08-11',
    sort_direction: 'newest_first',
    pilot_name: 'Pilot',
    is_instructor: false,
    zebra_color: '#fff',
    header_color: '#fff',
    ...overrides,
  }
}

describe('settings template adapters', () => {
  it('routes a 3.5.2 sheet to the v3 adapter', () => {
    const adapter = resolveSettingsTemplate(settings({ template_version: '3.5.2' }))

    expect(adapter.key).toBe('v3')
    expect(adapter.canEdit('pilot_name')).toBe(true)
    expect(adapter.canEdit('sort_direction')).toBe(false)
    expect(adapter.shows('medical')).toBe(false)
  })

  it('prefers the engine supplied by the API', () => {
    const adapter = resolveSettingsTemplate(
      settings({ template_engine: 'v3', template_version: 'unexpected' }),
    )

    expect(adapter.key).toBe('v3')
  })

  it('prefers the global logbook engine over settings fallback metadata', () => {
    const adapter = resolveSettingsTemplate(
      settings({ template_engine: 'legacy', template_version: '1' }),
      'v3',
    )

    expect(adapter.key).toBe('v3')
  })

  it('uses server capabilities as the authoritative field list', () => {
    const adapter = resolveSettingsTemplate(
      settings({
        template_engine: 'legacy',
        capabilities: {
          editable_fields: ['pilot_name'],
          display_preferences: false,
          medical_settings: false,
          summary_dates: false,
        },
      }),
    )

    expect(adapter.canEdit('pilot_name')).toBe(true)
    expect(adapter.canEdit('pilot_address')).toBe(false)
    expect(adapter.shows('displayPreferences')).toBe(false)
  })

  it('does not fall back when the API explicitly returns no editable fields', () => {
    const adapter = resolveSettingsTemplate(
      settings({
        capabilities: {
          editable_fields: [],
          display_preferences: false,
          medical_settings: false,
          summary_dates: false,
        },
      }),
    )

    expect(adapter.canEdit('pilot_name')).toBe(false)
  })
})
