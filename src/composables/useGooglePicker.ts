import { fetchGoogleAccessToken } from '@/api/auth'

declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void
    }
    google?: {
      picker: {
        Action: { PICKED: string; CANCEL: string }
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
      const view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS)
      view.setMimeTypes('application/vnd.google-apps.spreadsheet')

      const origin = window.location.origin

      const picker = new google.picker.PickerBuilder()
        .setAppId(getAppId())
        .setOrigin(origin)
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(apiKey)
        .setCallback((data: PickerResponse) => {
          if (data.action === google.picker.Action.CANCEL) {
            resolve(null)
            return
          }
          if (data.action === google.picker.Action.PICKED && data.docs?.[0]) {
            resolve({ id: data.docs[0].id, name: data.docs[0].name })
            return
          }
          reject(new Error('Unexpected picker response'))
        })
        .build()

      picker.setVisible(true)
    })
  }

  return { pickSpreadsheet }
}
