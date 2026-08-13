import { describe, expect, it } from 'vitest'
import { buildSettingsPatch, emptyLogbookProfileForm } from '@/lib/logbookProfile'

describe('buildSettingsPatch', () => {
  it('only submits fields supported by the selected template adapter', () => {
    const form = emptyLogbookProfileForm()
    form.pilot_name = ' Pilot '
    form.sort_direction = 'newest_first'

    const patch = buildSettingsPatch(form, (field) => field === 'pilot_name')

    expect(patch).toEqual({ pilot_name: 'Pilot' })
  })
})
