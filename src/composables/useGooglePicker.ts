import { fetchGoogleAccessToken } from '@/api/auth'

declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void
    }
    google?: {
      picker: {
        Action: { PICKED: string; CANCEL: string; LOADED: string; ERROR: string }
        ViewId: { SPREADSHEETS: string }
        DocsView: new (viewId?: string) => {
          setMimeTypes: (mime: string) => unknown
        }
        PickerBuilder: new () => {
          addView: (view: unknown) => PickerBuilderInstance
          setAppId: (appId: string) => PickerBuilderInstance
          setOrigin: (origin: string) => PickerBuilderInstance
          setOAuthToken: (token: string) => PickerBuilderInstance
          setDeveloperKey: (key: string) => PickerBuilderInstance
          setCallback: (cb: (data: PickerResponse) => void) => PickerBuilderInstance
          build: () => { setVisible: (visible: boolean) => void }
        }
      }
    }
  }
}

interface PickerBuilderInstance {
  addView: (view: unknown) => PickerBuilderInstance
  setAppId: (appId: string) => PickerBuilderInstance
  setOrigin: (origin: string) => PickerBuilderInstance
  setOAuthToken: (token: string) => PickerBuilderInstance
  setDeveloperKey: (key: string) => PickerBuilderInstance
  setCallback: (cb: (data: PickerResponse) => void) => PickerBuilderInstance
  build: () => { setVisible: (visible: boolean) => void }
}

interface PickerResponse {
  action: string
  docs?: Array<{ id: string; name: string }>
}

const GAPI_SCRIPT = 'https://apis.google.com/js/api.js'

let gapiLoaded = false

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

async function ensureGapiLoaded(): Promise<void> {
  if (gapiLoaded) return
  await loadScript(GAPI_SCRIPT)
  await new Promise<void>((resolve, reject) => {
    if (!window.gapi) {
      reject(new Error('Google API not available'))
      return
    }
    window.gapi.load('picker', () => {
      gapiLoaded = true
      resolve()
    })
  })
}

function getAppId(): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
  const match = clientId.match(/^(\d+)-/)
  if (!match?.[1]) {
    throw new Error('Cannot derive App ID from VITE_GOOGLE_CLIENT_ID')
  }
  return match[1]
}

export function useGooglePicker() {
  async function pickSpreadsheet(): Promise<{ id: string; name: string } | null> {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
    if (!apiKey) {
      throw new Error('VITE_GOOGLE_API_KEY is not configured')
    }
    if (!clientId) {
      throw new Error('VITE_GOOGLE_CLIENT_ID is not configured')
    }
    if (apiKey.includes('.apps.googleusercontent.com')) {
      throw new Error(
        'VITE_GOOGLE_API_KEY must be a Google API key (AIza...), not the OAuth Client ID',
      )
    }

    await ensureGapiLoaded()

    const accessToken = await fetchGoogleAccessToken()
    const google = window.google
    if (!google?.picker) {
      throw new Error('Google Picker API not available')
    }

    return new Promise((resolve, reject) => {
      let settled = false

      function finish(result: { id: string; name: string } | null): void {
        if (settled) return
        settled = true
        resolve(result)
      }

      function fail(message: string): void {
        if (settled) return
        settled = true
        reject(new Error(message))
      }

      const view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS)
      view.setMimeTypes('application/vnd.google-apps.spreadsheet')

      const picker = new google.picker.PickerBuilder()
        .setAppId(getAppId())
        .setOrigin(window.location.origin)
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(apiKey)
        .setCallback((data: PickerResponse) => {
          const action = data.action

          // Picker fires "loaded" when the dialog opens — not a user choice.
          if (action === google.picker.Action.LOADED || action === 'loaded') {
            return
          }

          if (action === google.picker.Action.CANCEL || action === 'cancel') {
            finish(null)
            return
          }

          if (action === google.picker.Action.ERROR || action === 'error') {
            fail('Google Picker failed to open')
            return
          }

          if (action === google.picker.Action.PICKED || action === 'picked') {
            const doc = data.docs?.[0]
            if (doc?.id) {
              finish({ id: doc.id, name: doc.name || 'Spreadsheet' })
              return
            }
            fail('No spreadsheet selected')
            return
          }
        })
        .build()

      picker.setVisible(true)
    })
  }

  return { pickSpreadsheet }
}
