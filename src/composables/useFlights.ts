import { readonly, ref } from 'vue'
import * as flightsApi from '@/api/flights'
import { isApiError } from '@/api/errors'
import type { Flight, FlightCreateRequest, FlightPatchRequest } from '@/types'

const flights = ref<Flight[]>([])
const total = ref(0)
const hasMore = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const listInitialized = ref(false)
const detailLoading = ref(false)
const detailInitialized = ref(false)
const mutating = ref(false)
const error = ref<string | null>(null)
const listSortDirection = ref<string | undefined>()

export function resetFlightsState(): void {
  flights.value = []
  total.value = 0
  hasMore.value = false
  loading.value = false
  loadingMore.value = false
  listInitialized.value = false
  detailLoading.value = false
  detailInitialized.value = false
  mutating.value = false
  error.value = null
  listSortDirection.value = undefined
}

export function useFlights() {
  async function list(sortDirection?: string): Promise<Flight[]> {
    loading.value = true
    error.value = null
    listSortDirection.value = sortDirection
    try {
      const page = await flightsApi.listFlights({
        limit: flightsApi.FLIGHT_LIST_PAGE_SIZE,
        offset: 0,
        sort_direction: sortDirection,
      })
      flights.value = page.results
      total.value = page.total
      hasMore.value = page.has_more
      listSortDirection.value = page.sort_direction
      return flights.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load flights'
      flights.value = []
      total.value = 0
      hasMore.value = false
      return []
    } finally {
      loading.value = false
      listInitialized.value = true
    }
  }

  async function loadMore(): Promise<void> {
    if (loadingMore.value || !hasMore.value) {
      return
    }

    loadingMore.value = true
    error.value = null
    try {
      const page = await flightsApi.listFlights({
        limit: flightsApi.FLIGHT_LIST_PAGE_SIZE,
        offset: flights.value.length,
        sort_direction: listSortDirection.value,
      })
      flights.value = [...flights.value, ...page.results]
      total.value = page.total
      hasMore.value = page.has_more
      listSortDirection.value = page.sort_direction
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load more flights'
    } finally {
      loadingMore.value = false
    }
  }

  async function get(id: string): Promise<Flight | null> {
    detailLoading.value = true
    detailInitialized.value = false
    error.value = null
    try {
      return await flightsApi.getFlight(id)
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load flight'
      return null
    } finally {
      detailLoading.value = false
      detailInitialized.value = true
    }
  }

  async function create(payload: FlightCreateRequest): Promise<Flight | null> {
    mutating.value = true
    error.value = null
    try {
      const flight = await flightsApi.createFlight(payload)
      flights.value = [flight, ...flights.value]
      total.value += 1
      return flight
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to create flight'
      throw err
    } finally {
      mutating.value = false
    }
  }

  async function update(id: string, payload: FlightPatchRequest): Promise<Flight | null> {
    mutating.value = true
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
      mutating.value = false
    }
  }

  async function remove(id: string): Promise<boolean> {
    mutating.value = true
    error.value = null
    try {
      await flightsApi.deleteFlight(id)
      flights.value = flights.value.filter((f) => f.id !== id)
      total.value = Math.max(0, total.value - 1)
      return true
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to delete flight'
      return false
    } finally {
      mutating.value = false
    }
  }

  function sortFlights(items: Flight[], direction: string): Flight[] {
    const sorted = [...items]
    sorted.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date)
      if (dateCmp !== 0) {
        return direction === 'newest_first' ? -dateCmp : dateCmp
      }
      const timeCmp = (a.launch_time || '').localeCompare(b.launch_time || '')
      return direction === 'newest_first' ? -timeCmp : timeCmp
    })
    return sorted
  }

  return {
    flights: readonly(flights),
    total: readonly(total),
    hasMore: readonly(hasMore),
    loading: readonly(loading),
    loadingMore: readonly(loadingMore),
    listInitialized: readonly(listInitialized),
    detailLoading: readonly(detailLoading),
    detailInitialized: readonly(detailInitialized),
    mutating: readonly(mutating),
    error: readonly(error),
    list,
    loadMore,
    get,
    create,
    update,
    remove,
    sortFlights,
  }
}
