import { describe, expect, it } from 'vitest'
import {
  buildColoredTrackSegments,
  formatIgcTime,
  formatVario,
  getAltitudeStats,
  metadataSummary,
  parseIgcTrack,
  pointAltitude,
} from '@/lib/igc'

describe('parseIgcTrack', () => {
  it('parses B-record latitude, longitude, altitude and vario', () => {
    const track = parseIgcTrack(`
AXCCGlider Pilot Logbook
HFDTE050721
HFPLTPILOTINCHARGE:Alice Pilot
HFGTYGLIDERTYPE:ASK-21
HFGIDGLIDERID:G-CAAA
B1234563909123N01123456EA0100001000
B1234573909234N01124567EA0100101001
B1234583909345N01125678EA0100301003
`)

    expect(track.points).toHaveLength(3)
    expect(track.points[0]).toMatchObject({
      time: '123456',
      lat: expect.closeTo(39.15205, 4),
      lng: expect.closeTo(11.390933, 4),
      pressureAltitudeM: 1000,
      gnssAltitudeM: 1000,
      validFix: true,
    })
    expect(track.points[1]?.varioMs).toBeCloseTo(1, 1)
    expect(track.points[2]?.varioMs).toBeCloseTo(2, 1)
    expect(track.metadata.pilot).toBe('Alice Pilot')
    expect(track.metadata.gliderType).toBe('ASK-21')
    expect(track.metadata.gliderId).toBe('G-CAAA')
    expect(track.metadata.date).toBe('5 Jul 2021')
  })

  it('ignores invalid lines', () => {
    const track = parseIgcTrack('HFDTE050721\nB12345\n')
    expect(track.points).toHaveLength(0)
  })
})

describe('igc helpers', () => {
  it('formats time, vario and metadata summary', () => {
    expect(formatIgcTime('123456')).toBe('12:34:56')
    expect(formatVario(1.25)).toBe('+1.3 m/s')
    expect(formatVario(-0.4)).toBe('-0.4 m/s')
    expect(
      metadataSummary({
        pilot: 'Alice',
        gliderType: 'ASK-21',
        gliderId: 'G-CAAA',
        date: '5 Jul 2021',
      }),
    ).toBe('Alice · ASK-21 · G-CAAA · 5 Jul 2021')
  })

  it('builds colored track segments from altitude', () => {
    const track = parseIgcTrack(`
B1234564748123N00831245EA0100001000
B1234574748234N00831345EA0110001100
B1235074748345N00831445EA0120001200
`)
    const stats = getAltitudeStats(track.points)
    expect(stats).toEqual({ min: 1000, max: 1200 })
    expect(pointAltitude(track.points[0]!)).toBe(1000)

    const segments = buildColoredTrackSegments(track.points, stats!)
    expect(segments.length).toBeGreaterThan(0)
    expect(segments[0]?.latlngs.length).toBeGreaterThan(1)
  })
})
