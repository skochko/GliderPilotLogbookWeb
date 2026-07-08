import { describe, expect, it } from 'vitest'
import { decodeFlightId, encodeFlightId } from '../flightId'

describe('flightId', () => {
  it('encodes composite flight ids for URL paths', () => {
    const id = '2025-11-08Field09:05Field10:15'
    expect(encodeFlightId(id)).toBe(encodeURIComponent(id))
  })

  it('round-trips encoded ids', () => {
    const id = '2025-11-08Field09:05Field10:15'
    expect(decodeFlightId(encodeFlightId(id))).toBe(id)
  })
})
