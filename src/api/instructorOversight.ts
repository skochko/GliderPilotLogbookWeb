import { apiFetch, apiJson } from './client'
import { parseApiError } from './errors'
import type { ClubInstructorOverview, InstructorActivityDetail } from '@/types/instructorOversight'

export function getClubInstructorOverview(): Promise<ClubInstructorOverview> {
  return apiJson<ClubInstructorOverview>('/instructor/club-instructors')
}

export function getClubInstructorActivityDetail(
  profileId: number,
): Promise<InstructorActivityDetail> {
  return apiJson<InstructorActivityDetail>(
    `/instructor/club-instructors/${encodeURIComponent(profileId)}/flight-activity`,
  )
}

export async function downloadClubInstructorReport(profileId: number): Promise<Blob> {
  const response = await apiFetch(
    `/instructor/club-instructors/${encodeURIComponent(profileId)}/flight-activity.pdf`,
  )
  if (!response.ok) throw await parseApiError(response)
  return response.blob()
}
