import { apiJson } from './client'

export interface AirfieldSuggestion {
  id: number
  name: string
  code: string
  country_code: string
  latitude: string | null
  longitude: string | null
  elevation_m: number | null
  timezone: string
  source: string
}

export function searchAirfields(query: string, signal?: AbortSignal): Promise<AirfieldSuggestion[]> {
  const search = new URLSearchParams({ q: query })
  return apiJson<AirfieldSuggestion[]>(`/airfields?${search.toString()}`, { signal })
}
