import { describe, expect, it } from 'vitest'
import { trailStartIndex } from '@/lib/trackPlayback'
import type { IgcPoint } from '@/lib/igc'

function point(time: string): IgcPoint {
  return {
    time,
    lat: 0,
    lng: 0,
    validFix: true,
    pressureAltitudeM: null,
    gnssAltitudeM: 0,
    varioMs: null,
  }
}

describe('trailStartIndex', () => {
  it('keeps only the requested duration behind the current point', () => {
    const points = ['120000', '120030', '120100', '120130'].map(point)
    expect(trailStartIndex(points, 0, 3, 60)).toBe(1)
  })

  it('does not move before the selected range start', () => {
    const points = ['120000', '120030', '120100', '120130'].map(point)
    expect(trailStartIndex(points, 2, 3, 60)).toBe(2)
  })

  it('supports a track crossing midnight', () => {
    const points = ['235930', '000000', '000030'].map(point)
    expect(trailStartIndex(points, 0, 2, 45)).toBe(1)
  })
})
