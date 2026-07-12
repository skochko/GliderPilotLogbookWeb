import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetToastState, useToast } from '../useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetToastState()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows and dismisses toast', () => {
    const { show, dismiss, visible, message } = useToast()

    show('Signed out', 'error')
    expect(visible.value).toBe(true)
    expect(message.value).toBe('Signed out')

    dismiss()
    expect(visible.value).toBe(false)
  })

  it('auto-dismisses after duration', () => {
    const { show, visible } = useToast()

    show('Signed out', 'error', 5000)
    expect(visible.value).toBe(true)

    vi.advanceTimersByTime(5000)
    expect(visible.value).toBe(false)
  })
})
