import { apiJson } from './client'
import type { Flight, FlightCreateRequest, FlightPatchRequest } from '@/types'
import { encodeFlightId } from '@/lib/flightId'

export function listFlights(): Promise<Flight[]> {
  return apiJson<Flight[]>('/flights')
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
