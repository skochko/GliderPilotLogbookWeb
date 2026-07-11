import { apiJson } from './client'
import type { LandingContent } from '@/types/landing'

export function getLandingContent(): Promise<LandingContent> {
  return apiJson<LandingContent>('/landing')
}
