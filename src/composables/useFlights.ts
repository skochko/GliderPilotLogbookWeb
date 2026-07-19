import { readonly, ref } from 'vue'
import * as flightsApi from '@/api/flights'
import { isApiError } from '@/api/errors'
import {
  emptyFlightListFilters,
  flightListFiltersToParams,
  queryFromSortPreset,
  sortPresetFromQuery,
  type FlightListSortPreset,
} from '@/lib/flightListQuery'
import type {
  Flight,
  FlightCreateRequest,
  FlightFilterOptions,
  FlightListFilters,
  FlightPatchRequest,
  FlightSortBy,
} from '@/types'

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
const listSortBy = ref<FlightSortBy>('date')
const listSortDirection = ref<string | undefined>()
const listFilters = ref<FlightListFilters>(emptyFlightListFilters())
const filterOptions = ref<FlightFilterOptions>({ gliders: [], registrations: [], launch_types: [] })

let listRequestId = 0

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
  listSortBy.value = 'date'
  listSortDirection.value = undefined
  listFilters.value = emptyFlightListFilters()
  filterOptions.value = { gliders: [], registrations: [], launch_types: [] }
  listRequestId = 0
}

function buildListParams(offset: number) {
  return {
    limit: flightsApi.FLIGHT_LIST_PAGE_SIZE,
    offset,
    sort_by: listSortBy.value,
    sort_direction: listSortDirection.value,
    ...flightListFiltersToParams(listFilters.value),
  }
}

function applyListPage(page: Awaited<ReturnType<typeof flightsApi.listFlights>>, append: boolean): void {
  flights.value = append ? [...flights.value, ...page.results] : page.results
  total.value = page.total
  hasMore.value = page.has_more
  listSortBy.value = page.sort_by
  listSortDirection.value = page.sort_direction
  filterOptions.value = page.filter_options
}

export function useFlights() {
  async function list(options?: {
    sortPreset?: FlightListSortPreset
    sortDirection?: string
    filters?: FlightListFilters
  }): Promise<Flight[]> {
    const requestId = ++listRequestId
    loading.value = true
    listInitialized.value = false
    error.value = null

    if (options?.sortPreset) {
      const query = queryFromSortPreset(options.sortPreset)
      listSortBy.value = query.sort_by
      listSortDirection.value = query.sort_direction
    } else if (options?.sortDirection) {
      listSortDirection.value = options.sortDirection
    }

    if (options?.filters) {
      listFilters.value = { ...options.filters }
    }

    try {
      const page = await flightsApi.listFlights(buildListParams(0))
      if (requestId !== listRequestId) {
        return flights.value
      }
      applyListPage(page, false)
      return flights.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load flights'
      flights.value = []
      total.value = 0
      hasMore.value = false
      return []
    } finally {
      if (requestId === listRequestId) {
        loading.value = false
        listInitialized.value = true
      }
    }
  }

  async function loadMore(): Promise<void> {
    if (loadingMore.value || loading.value || !hasMore.value) {
      return
    }

    const requestId = listRequestId
    loadingMore.value = true
    error.value = null
    try {
      const page = await flightsApi.listFlights(buildListParams(flights.value.length))
      if (requestId !== listRequestId) {
        return
      }
      applyListPage(page, true)
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load more flights'
    } finally {
      if (requestId === listRequestId) {
        loadingMore.value = false
      }
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

  function currentSortPreset(): FlightListSortPreset {
    return sortPresetFromQuery(listSortBy.value, listSortDirection.value ?? 'newest_first')
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
    listFilters: readonly(listFilters),
    filterOptions: readonly(filterOptions),
    currentSortPreset,
    list,
    loadMore,
    get,
    create,
    update,
    remove,
  }
}
