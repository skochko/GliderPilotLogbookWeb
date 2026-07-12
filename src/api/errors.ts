import type { ApiErrorBody, ApiErrorResponse } from '@/types'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown> | unknown[]

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
    this.details = body.details
  }

  fieldErrors(): Record<string, string[]> {
    if (!this.details || Array.isArray(this.details)) {
      return {}
    }
    const result: Record<string, string[]> = {}
    for (const [key, value] of Object.entries(this.details)) {
      if (Array.isArray(value)) {
        result[key] = value.map(String)
      } else if (typeof value === 'string') {
        result[key] = [value]
      }
    }
    return result
  }
}

export async function parseApiError(res: Response): Promise<ApiError> {
  let body: ApiErrorResponse | null = null
  try {
    body = (await res.json()) as ApiErrorResponse
  } catch {
    // ignore
  }

  if (body?.error) {
    return new ApiError(res.status, body.error)
  }

  return new ApiError(res.status, {
    code: 'UNKNOWN_ERROR',
    message: res.statusText || 'Request failed',
    details: {},
  })
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

export function isAccountIncompleteError(err: unknown): err is ApiError {
  return isApiError(err) && err.code === 'ACCOUNT_INCOMPLETE'
}
