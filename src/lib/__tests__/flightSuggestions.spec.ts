import { describe, expect, it } from 'vitest'
import { collectFlightFieldSuggestions } from '../flightSuggestions'

describe('collectFlightFieldSuggestions', () => {
  it('returns unique sorted non-empty values per field', () => {
    const suggestions = collectFlightFieldSuggestions([
      {
        pilot: 'Alice',
        copilot: ' Bob ',
        glider: 'ASK-21',
        registration: 'G-ABCD',
        departure_place: 'ABC',
        arrival_place: 'ABC',
      },
      {
        pilot: 'Alice',
        copilot: '',
        glider: 'DG-1000',
        registration: 'G-ABCD',
        departure_place: 'XYZ',
        arrival_place: '',
      },
    ])

    expect(suggestions.pilot).toEqual(['Alice'])
    expect(suggestions.copilot).toEqual(['Bob'])
    expect(suggestions.glider).toEqual(['ASK-21', 'DG-1000'])
    expect(suggestions.registration).toEqual(['G-ABCD'])
    expect(suggestions.departure_place).toEqual(['ABC', 'XYZ'])
    expect(suggestions.arrival_place).toEqual(['ABC'])
  })
})
