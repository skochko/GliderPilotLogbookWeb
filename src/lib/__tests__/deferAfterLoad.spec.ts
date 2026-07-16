import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deferAfterLoad } from '../deferAfterLoad'

describe('deferAfterLoad', () => {
  beforeEach(() => {
    vi.stubGlobal('requestIdleCallback', (cb: IdleRequestCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline)
      return 1
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('runs callback after load when document is not complete', () => {
    Object.defineProperty(document, 'readyState', { configurable: true, value: 'interactive' })

    const callback = vi.fn()
    deferAfterLoad(callback)
    expect(callback).not.toHaveBeenCalled()

    window.dispatchEvent(new Event('load'))
    expect(callback).toHaveBeenCalledOnce()
  })

  it('runs callback immediately when document is already complete', () => {
    Object.defineProperty(document, 'readyState', { configurable: true, value: 'complete' })

    const callback = vi.fn()
    deferAfterLoad(callback)
    expect(callback).toHaveBeenCalledOnce()
  })
})
