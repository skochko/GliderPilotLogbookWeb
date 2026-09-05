import { describe, expect, it } from 'vitest'
import { calculateTerrainAltitudeCorrection } from '@/lib/trackAltitude'

describe('calculateTerrainAltitudeCorrection', () => {
  it('keeps the existing endpoint correction when the track clears terrain', () => {
    const ground = Array.from({ length: 100 }, () => 150)
    const altitudes = Array.from({ length: 100 }, (_, index) =>
      index < 30 || index >= 70 ? 100 : 300,
    )

    expect(calculateTerrainAltitudeCorrection(altitudes, ground)).toBe(50)
  })

  it('lifts a track when airborne endpoint samples pull it below terrain', () => {
    const ground = Array.from({ length: 100 }, (_, index) => 100 + index * 2)
    const altitudes = Array.from({ length: 100 }, (_, index) => 250 + Math.sin(index / 8) * 20)
    const correction = calculateTerrainAltitudeCorrection(altitudes, ground)
    const clearances = altitudes
      .map((altitude, index) => altitude + correction - ground[index]!)
      .sort((a, b) => a - b)

    expect(clearances[Math.ceil(clearances.length * 0.01)]).toBeCloseTo(3)
  })

  it('does not lift an otherwise valid track for one bad terrain sample', () => {
    const ground = Array.from({ length: 100 }, () => 100)
    ground[0] = 500
    const altitudes = Array.from({ length: 100 }, () => 110)

    expect(calculateTerrainAltitudeCorrection(altitudes, ground)).toBe(-10)
  })
})
