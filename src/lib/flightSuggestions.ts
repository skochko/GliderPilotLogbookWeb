import type { Flight } from '@/types'

export type FlightFieldSuggestions = {
  pilot: string[]
  copilot: string[]
  glider: string[]
  registration: string[]
  departure_place: string[]
  arrival_place: string[]
}

type SuggestionFlight = Pick<
  Flight,
  'pilot' | 'copilot' | 'glider' | 'registration' | 'departure_place' | 'arrival_place'
>

const SUGGESTION_FIELDS: (keyof FlightFieldSuggestions)[] = [
  'pilot',
  'copilot',
  'glider',
  'registration',
  'departure_place',
  'arrival_place',
]

function uniqueSorted(values: Iterable<string>): string[] {
  const seen = new Set<string>()
  for (const value of values) {
    const trimmed = value.trim()
    if (trimmed) {
      seen.add(trimmed)
    }
  }
  return [...seen].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

export function collectFlightFieldSuggestions(flights: readonly SuggestionFlight[]): FlightFieldSuggestions {
  const buckets: Record<keyof FlightFieldSuggestions, string[]> = {
    pilot: [],
    copilot: [],
    glider: [],
    registration: [],
    departure_place: [],
    arrival_place: [],
  }

  for (const flight of flights) {
    for (const field of SUGGESTION_FIELDS) {
      buckets[field].push(flight[field] ?? '')
    }
  }

  return {
    pilot: uniqueSorted(buckets.pilot),
    copilot: uniqueSorted(buckets.copilot),
    glider: uniqueSorted(buckets.glider),
    registration: uniqueSorted(buckets.registration),
    departure_place: uniqueSorted(buckets.departure_place),
    arrival_place: uniqueSorted(buckets.arrival_place),
  }
}
