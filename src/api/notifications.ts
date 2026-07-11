import { apiJson } from './client'

export interface UnsubscribeResponse {
  status: 'unsubscribed'
}

export function unsubscribe(token: string): Promise<UnsubscribeResponse> {
  return apiJson<UnsubscribeResponse>('/notifications/unsubscribe/', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}
