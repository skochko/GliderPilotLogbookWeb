import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as statisticsApi from '@/api/statistics'
import { resetStatisticsState, useStatistics } from '@/composables/useStatistics'
import type { Statistics } from '@/types'

vi.mock('@/api/statistics', () => ({
  getStatistics: vi.fn(),
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function statistics(totalFlights: number): Statistics {
  return { total_flights: totalFlights } as Statistics
}

describe('useStatistics', () => {
  beforeEach(() => {
    resetStatisticsState()
    vi.mocked(statisticsApi.getStatistics).mockReset()
  })

  it('does not let an older request overwrite a newer result', async () => {
    const older = deferred<Statistics>()
    const newer = deferred<Statistics>()
    vi.mocked(statisticsApi.getStatistics)
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise)

    const { statistics: current, loading, fetch } = useStatistics()
    const olderRequest = fetch({ from: '2026-01-01', to: '2026-08-28' })
    const newerRequest = fetch({ from: '2026-02-21', to: '2026-08-28' })

    newer.resolve(statistics(99))
    await newerRequest
    expect(current.value?.total_flights).toBe(99)
    expect(loading.value).toBe(false)

    older.resolve(statistics(108))
    await olderRequest
    expect(current.value?.total_flights).toBe(99)
    expect(loading.value).toBe(false)
  })
})
