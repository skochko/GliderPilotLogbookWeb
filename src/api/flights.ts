import { apiJson } from './client'
import type { Flight, FlightCreateRequest, FlightListParams, FlightListResponse, FlightPatchRequest } from '@/types'
import { encodeFlightId } from '@/lib/flightId'

export const FLIGHT_LIST_PAGE_SIZE = 100
export const RECENT_FLIGHTS_LIMIT = 10

export function listFlights(params: FlightListParams = {}): Promise<FlightListResponse> {
  const search = new URLSearchParams()
  search.set('limit', String(params.limit ?? FLIGHT_LIST_PAGE_SIZE))
  search.set('offset', String(params.offset ?? 0))
  if (params.sort_direction) {
    search.set('sort_direction', params.sort_direction)
  }
  return apiJson<FlightListResponse>(`/flights?${search.toString()}`)
}

export function getFlight(id: string): Promise<Flight> {
  return apiJson<Flight>(`/flights/${encodeFlightId(id)}`)
}

export function createFlight(payload: FlightCreateRequest): Promise<Flight> {
  return apiJson<Flight>('/flights', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateFlight(id: string, payload: FlightPatchRequest): Promise<Flight> {
  return apiJson<Flight>(`/flights/${encodeFlightId(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteFlight(id: string): Promise<void> {
  return apiJson<void>(`/flights/${encodeFlightId(id)}`, { method: 'DELETE' })
}
