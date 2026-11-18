import { apiJson } from './client'

export interface ClubInquiryPayload {
  club_name: string
  contact_name: string
  email: string
  phone: string
  message: string
  turnstile_token: string
  /** Honeypot: hidden from people, so it stays empty unless a bot fills it in. */
  website: string
}

export function sendClubInquiry(payload: ClubInquiryPayload): Promise<{ status: string }> {
  return apiJson<{ status: string }>('/club-inquiries', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
