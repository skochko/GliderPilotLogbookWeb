/** Run after full page load, when the browser is idle (keeps CLS/LCP windows clean). */
export function deferAfterLoad(callback: () => void): void {
  const run = (): void => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(callback, { timeout: 2500 })
      return
    }
    setTimeout(callback, 1)
  }

  if (document.readyState === 'complete') {
    run()
    return
  }

  window.addEventListener('load', run, { once: true })
}
