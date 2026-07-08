import { readonly, ref } from 'vue'
import * as flightsApi from '@/api/flights'
import { isApiError } from '@/api/errors'
import type { Flight, FlightCreateRequest, FlightPatchRequest } from '@/types'

const flights = ref<Flight[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useFlights() {
  async function list(): Promise<Flight[]> {
    loading.value = true
    error.value = null
    try {
      flights.value = await flightsApi.listFlights()
      return flights.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load flights'
      flights.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  async function get(id: string): Promise<Flight | null> {
    loading.value = true
    error.value = null
    try {
      return await flightsApi.getFlight(id)
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load flight'
      return null
    } finally {
      loading.value = false
    }
  }

  async function create(payload: FlightCreateRequest): Promise<Flight | null> {
    loading.value = true
    error.value = null
    try {
      const flight = await flightsApi.createFlight(payload)
      flights.value = [flight, ...flights.value]
      return flight
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to create flight'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: FlightPatchRequest): Promise<Flight | null> {
    loading.value = true
    error.value = null
    try {
      const flight = await flightsApi.updateFlight(id, payload)
      const index = flights.value.findIndex((f) => f.id === id)
      if (index >= 0) {
        flights.value[index] = flight
      }
      return flight
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to update flight'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await flightsApi.deleteFlight(id)
      flights.value = flights.value.filter((f) => f.id !== id)
      return true
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to delete flight'
      return false
    } finally {
      loading.value = false
    }
  }

  function sortFlights(items: Flight[], direction: string): Flight[] {
    const sorted = [...items]
    sorted.sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date)
      if (dateCmp !== 0) {
        return direction === 'oldest_first' ? -dateCmp : dateCmp
      }
      const timeCmp = (b.launch_time || '').localeCompare(a.launch_time || '')
      return direction === 'oldest_first' ? -timeCmp : timeCmp
    })
    return sorted
  }

  return {
    flights: readonly(flights),
    loading: readonly(loading),
    error: readonly(error),
    list,
    get,
    create,
    update,
    remove,
    sortFlights,
  }
}
