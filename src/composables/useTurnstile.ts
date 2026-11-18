/**
 * Cloudflare Turnstile bot check. Does nothing when VITE_TURNSTILE_SITE_KEY is not set
 * (local development); the backend skips the check too when it has no secret key.
 */

interface TurnstileApi {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string
      callback: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
      theme?: 'auto' | 'light' | 'dark'
      size?: 'normal' | 'flexible' | 'compact'
    },
  ) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let scriptPromise: Promise<TurnstileApi> | null = null

export function turnstileSiteKey(): string {
  return (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() ?? ''
}

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile)
  }
  if (!scriptPromise) {
    scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_URL
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.turnstile) {
          resolve(window.turnstile)
        } else {
          reject(new Error('Turnstile failed to load'))
        }
      }
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('Turnstile failed to load'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

export interface TurnstileWidget {
  reset: () => void
  remove: () => void
}

/** Render the widget into `element`; `onToken` receives a token, or '' when it expires. */
export async function renderTurnstile(
  element: HTMLElement,
  onToken: (token: string) => void,
): Promise<TurnstileWidget | null> {
  const sitekey = turnstileSiteKey()
  if (!sitekey) {
    return null
  }
  const api = await loadTurnstile()
  const widgetId = api.render(element, {
    sitekey,
    theme: 'light',
    size: 'flexible',
    callback: onToken,
    'expired-callback': () => onToken(''),
    'error-callback': () => onToken(''),
  })
  return {
    reset: () => {
      onToken('')
      api.reset(widgetId)
    },
    remove: () => api.remove(widgetId),
  }
}
