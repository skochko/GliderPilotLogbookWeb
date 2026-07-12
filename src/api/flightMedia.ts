import { API, apiJson, apiFetch, getCsrfToken } from './client'
import { parseApiError } from './errors'
import { encodeFlightId } from '@/lib/flightId'
import type { FlightMediaFolder, FlightMediaItem, FlightMediaUploadResponse } from '@/types'

const UPLOAD_TIMEOUT_MS = 15 * 60 * 1000

export type MediaUploadProgress = {
  loaded: number
  total: number | null
  percent: number | null
}

export function encodeMediaFilename(filename: string): string {
  return filename
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

export function flightMediaContentPath(flightId: string, filename: string): string {
  return `/flights/${encodeFlightId(flightId)}/media/${encodeMediaFilename(filename)}`
}

export function flightMediaContentUrl(flightId: string, filename: string): string {
  return `${API}${flightMediaContentPath(flightId, filename)}`
}

export function listFlightMedia(flightId: string): Promise<FlightMediaItem[]> {
  return apiJson<FlightMediaItem[]>(`/flights/${encodeFlightId(flightId)}/media`)
}

export function getFlightMediaFolder(flightId: string): Promise<FlightMediaFolder> {
  return apiJson<FlightMediaFolder>(`/flights/${encodeFlightId(flightId)}/media/folder`)
}

export async function uploadFlightMedia(
  flightId: string,
  file: File,
  options?: {
    onProgress?: (progress: MediaUploadProgress) => void
    signal?: AbortSignal
  },
): Promise<FlightMediaUploadResponse> {
  const form = new FormData()
  form.append('file', file)
  const csrfToken = await getCsrfToken()

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API}/flights/${encodeFlightId(flightId)}/media`)
    xhr.withCredentials = true
    xhr.timeout = UPLOAD_TIMEOUT_MS
    xhr.setRequestHeader('X-CSRFToken', csrfToken)

    xhr.upload.onprogress = (event) => {
      if (!options?.onProgress) {
        return
      }

      if (event.lengthComputable) {
        options.onProgress({
          loaded: event.loaded,
          total: event.total,
          percent: Math.min(100, Math.round((event.loaded / event.total) * 100)),
        })
        return
      }

      options.onProgress({
        loaded: event.loaded,
        total: null,
        percent: null,
      })
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as FlightMediaUploadResponse)
        } catch {
          reject(new Error('Invalid upload response'))
        }
        return
      }

      void parseApiError(
        new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
        }),
      ).then(reject)
    }

    xhr.onerror = () => {
      reject(new Error('Upload failed'))
    }

    xhr.ontimeout = () => {
      reject(new Error('Upload timed out'))
    }

    xhr.onabort = () => {
      reject(new Error('Upload cancelled'))
    }

    if (options?.signal) {
      if (options.signal.aborted) {
        xhr.abort()
        return
      }
      options.signal.addEventListener(
        'abort',
        () => {
          xhr.abort()
        },
        { once: true },
      )
    }

    xhr.send(form)
  })
}

export function attachFlightMediaFromDrive(
  flightId: string,
  driveFileId: string,
): Promise<FlightMediaUploadResponse> {
  return apiJson<FlightMediaUploadResponse>(`/flights/${encodeFlightId(flightId)}/media/from-drive`, {
    method: 'POST',
    body: JSON.stringify({ drive_file_id: driveFileId }),
  })
}

export async function fetchFlightIgcContent(flightId: string, filename: string): Promise<string> {
  const res = await apiFetch(flightMediaContentPath(flightId, filename))
  if (!res.ok) {
    throw await parseApiError(res)
  }
  return res.text()
}

export async function fetchFlightMediaBlob(flightId: string, filename: string): Promise<Blob> {
  const res = await apiFetch(flightMediaContentPath(flightId, filename))
  if (!res.ok) {
    throw await parseApiError(res)
  }
  return res.blob()
}
